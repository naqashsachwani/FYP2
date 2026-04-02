import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { inngest } from "@/inngest/client"; 
import { sendNotification } from "@/lib/sendNotification"; // ✅ IMPORT ENGINE

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
            user: { select: { name: true, id: true, email: true } }, // ✅ Added email
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
      include: { 
        goal: { include: { user: true } }, // ✅ Ensure user email is available
        filerStore: true, 
        filerUser: true,
        targetUser: true
      }
    });

    if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let successfulCoupon = null;
    let pendingNotifications = []; // ✅ QUEUE NOTIFICATIONS TO SEND AFTER TX

    await prisma.$transaction(async (tx) => {
      // 1. Update Complaint Status
      await tx.complaint.update({
        where: { id: complaintId },
        data: { status, adminNotes, resolvedAt: status === "RESOLVED" ? new Date() : null }
      });

      // =========================================================
      // 🎁 LOGIC 1: ISSUE APOLOGY COUPON
      // =========================================================
      let generatedCouponCode = null;
      const validDays = Number(expiryDays) || 30; 

      if (issueCoupon && status === "RESOLVED" && complaint.filerUserId) {
        generatedCouponCode = `SORRY-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + validDays);

        const newCoupon = await tx.coupon.create({
          data: {
            code: generatedCouponCode,
            description: `Apology for complaint: ${complaint.title}`,
            discount: Number(couponValue), 
            usageLimit: 1,           
            forNewUser: false,       
            forMember: false,        
            isPublic: false,         
            userId: complaint.filerUserId, 
            expiresAt: expiryDate
          }
        });

        successfulCoupon = newCoupon; 
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

          // ✅ Queue the Refund Notification
          pendingNotifications.push({
            userId: complaint.goal.userId,
            email: complaint.goal.user?.email, // Only available if requested in findUnique
            type: "REFUND_ISSUED", // Match Enum
            title: "Refund Approved 💰",
            message: message
          });
        }
      } 
      // =========================================================
      // 🏷️ LOGIC 3: ADMIN APPROVES PRICE LOCK CHANGE
      // =========================================================
      else if (complaint.type === "PRICE_LOCK" && status === "RESOLVED" && newPrice) {
        const adjustedPrice = Number(newPrice);
        await tx.goal.update({ where: { id: complaint.goalId }, data: { targetAmount: adjustedPrice } });

        // ✅ Queue Price Lock Notifications
        pendingNotifications.push({ 
          userId: complaint.filerStore.userId, 
          type: "SYSTEM_ALERT", 
          title: "Price Lock Updated", 
          message: `New price: Rs ${adjustedPrice.toLocaleString()}` 
        });

        pendingNotifications.push({ 
          userId: complaint.goal.userId, 
          email: complaint.goal.user?.email,
          type: "SYSTEM_ALERT", 
          title: "Price Adjustment Alert", 
          message: `The price for your goal has been adjusted to Rs ${adjustedPrice.toLocaleString()}`, 
          goalId: complaint.goalId 
        });
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

              // ✅ Queue Filer Notification
              pendingNotifications.push({ 
                userId: filerUserId, 
                email: complaint.filerUser?.email,
                type: status === "RESOLVED" ? "COMPLAINT_RESOLVED" : "SYSTEM_ALERT", 
                title: `Complaint ${status}`, 
                message: message 
              });
          }

          if (status === "RESOLVED") {
             const warningTargetId = complaint.targetUserId || complaint.targetStore?.userId;
             if (warningTargetId) {
                // ✅ Queue Target Notification
                pendingNotifications.push({ 
                  userId: warningTargetId, 
                  email: complaint.targetUser?.email,
                  type: "SYSTEM_ALERT", 
                  title: "⚠️ Official Admin Warning", 
                  message: `A complaint against your account was reviewed. Admin Note: ${adminNotes}` 
                });
             }
          }
      }
    });

    // =========================================================
    // ⏰ FIRE ALL ASYNC EVENTS AFTER SUCCESSFUL DB TRANSACTION
    // =========================================================
    
    // 1. Send all queued notifications
    for (const notif of pendingNotifications) {
      await sendNotification({
        ...notif,
        notifyInApp: true,
        notifyEmail: !!notif.email // Only trigger email if we fetched their email address
      });
    }

    // 2. Schedule coupon expiration in Inngest
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