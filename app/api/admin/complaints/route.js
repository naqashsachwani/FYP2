import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { inngest } from "@/inngest/client"; // ✅ Imported Inngest for expiration

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    
    const complaints = await prisma.complaint.findMany({
      include: {
        filerUser: { select: { name: true, image: true, email: true } },
        filerStore: { select: { name: true, logo: true } },
        targetUser: { select: { name: true, email: true } },
        targetStore: { select: { name: true, userId: true } },
        goal: { 
          include: { 
            product: true,
            user: { select: { name: true, id: true } },
            escrow: true 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ complaints });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { complaintId, status, adminNotes, newPrice, processRefund, issueCoupon, couponValue, expiryDays } = await req.json();

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { goal: true, filerStore: true, filerUser: true }
    });

    if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // We will store the generated coupon data here so we can send it to Inngest AFTER the transaction succeeds
    let successfulCoupon = null;

    await prisma.$transaction(async (tx) => {
      // 1. Update Complaint Status
      await tx.complaint.update({
        where: { id: complaintId },
        data: { status, adminNotes, resolvedAt: status === "RESOLVED" ? new Date() : null }
      });

      // =========================================================
      // 🎁 LOGIC 1: ISSUE APOLOGY COUPON (MATCHING YOUR SCHEMA)
      // =========================================================
      let generatedCouponCode = null;
      const validDays = Number(expiryDays) || 30; 

      if (issueCoupon && status === "RESOLVED" && complaint.filerUserId) {
        generatedCouponCode = `SORRY-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + validDays);

        // ✅ EXACT match to your database requirements + userId
        const newCoupon = await tx.coupon.create({
          data: {
            code: generatedCouponCode,
            description: `Apology for complaint: ${complaint.title}`,
            discount: Number(couponValue), 
            usageLimit: 1,           // Single use for the complaining user
            forNewUser: false,       // Not a sign-up promo
            forMember: false,        // Standard
            isPublic: false,         // Hide from public pages
            userId: complaint.filerUserId, // ✅ LOCKS THIS COUPON TO THE USER
            expiresAt: expiryDate
          }
        });

        successfulCoupon = newCoupon; // Save for Inngest
      }

      // =========================================================
      // 💰 LOGIC 2: ADMIN ISSUES A FULL REFUND TO USER
      // =========================================================
      if (processRefund && status === "RESOLVED" && complaint.goal) {
        const refundAmount = Number(complaint.goal.saved);

        if (refundAmount > 0) {
          await tx.goal.update({
            where: { id: complaint.goalId },
            data: { status: "REFUNDED" }
          });

          const wallet = await tx.wallet.upsert({
            where: { userId: complaint.goal.userId },
            create: { userId: complaint.goal.userId, balance: refundAmount },
            update: { balance: { increment: refundAmount } }
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: refundAmount,
              type: "REFUND_CREDIT",
              description: `Admin Resolution Refund for ${complaint.goal.product?.name || "Goal"}`,
              referenceId: complaint.goalId
            }
          });

          const escrow = await tx.escrow.findUnique({ where: { goalId: complaint.goalId } });
          if (escrow) {
            await tx.escrow.update({
              where: { id: escrow.id },
              data: { status: "REFUNDED", netAmount: refundAmount, platformFee: 0, notes: "Refunded to User" }
            });
          }

          let message = `Your complaint was resolved. Rs ${refundAmount.toLocaleString()} has been added to your Wallet.`;
          if (generatedCouponCode) {
            message += ` As an apology, here is a promo code: ${generatedCouponCode} (Discount: ${couponValue}). Valid for ${validDays} days!`;
          }

          await tx.notification.create({
            data: {
              userId: complaint.goal.userId,
              type: "SYSTEM_ALERT",
              title: "Refund Approved 💰",
              message: message,
            }
          });
        }
      } 
      // =========================================================
      // 🏷️ LOGIC 3: ADMIN APPROVES PRICE LOCK CHANGE
      // =========================================================
      else if (complaint.type === "PRICE_LOCK" && status === "RESOLVED" && newPrice) {
        const adjustedPrice = Number(newPrice);
        await tx.goal.update({ where: { id: complaint.goalId }, data: { targetAmount: adjustedPrice } });

        await tx.notification.create({ data: { userId: complaint.filerStore.userId, type: "SYSTEM_ALERT", title: "Price Lock Updated", message: `New price: Rs ${adjustedPrice.toLocaleString()}` } });
        await tx.notification.create({ data: { userId: complaint.goal.userId, type: "SYSTEM_ALERT", title: "Price Adjustment Alert", message: `The price for your goal has been adjusted to Rs ${adjustedPrice.toLocaleString()}`, goalId: complaint.goalId } });
      } 
      // =========================================================
      // 📝 LOGIC 4: STANDARD COMPLAINT / BEHAVIOR RESPONSE
      // =========================================================
      else {
          const filerUserId = complaint.filerUserId || complaint.filerStore?.userId;
          if (filerUserId) {
              let message = `Your complaint "${complaint.title}" is now ${status}. Admin Note: ${adminNotes}`;
              
              if (generatedCouponCode && status === "RESOLVED") {
                 message = `Your complaint was resolved. As an apology, here is a promo code: ${generatedCouponCode} (Discount: ${couponValue}). Valid for ${validDays} days! Admin Note: ${adminNotes}`;
              }

              await tx.notification.create({ data: { userId: filerUserId, type: "SYSTEM_ALERT", title: `Complaint ${status}`, message: message } });
          }

          if (status === "RESOLVED") {
             const warningTargetId = complaint.targetUserId || complaint.targetStore?.userId;
             if (warningTargetId) {
                await tx.notification.create({ data: { userId: warningTargetId, type: "SYSTEM_ALERT", title: "⚠️ Official Admin Warning", message: `A complaint against your account was reviewed. Admin Note: ${adminNotes}` } });
             }
          }
      }
    });

    // =========================================================
    // ⏰ SEND TO INNGEST AFTER SUCCESSFUL TRANSACTION
    // =========================================================
    if (successfulCoupon) {
      await inngest.send({
        name: "app/coupon.expired",
        data: {
          code: successfulCoupon.code,
          expires_at: successfulCoupon.expiresAt,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}