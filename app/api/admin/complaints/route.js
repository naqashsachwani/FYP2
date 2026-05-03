import prisma from "@/lib/prisma"; 
import { getAuth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server"; 
import crypto from "crypto"; 
import { inngest } from "@/inngest/client"; 
import { sendNotification } from "@/lib/sendNotification"; 

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    
    const complaints = await prisma.complaint.findMany({
      include: {
        // ✅ FIXED: Fetch the entire user object to securely verify if they are a 'RIDER' or 'USER'
        filerUser: true, 
        filerStore: { select: { name: true, logo: true } },
        targetUser: { select: { name: true, email: true } }, 
        targetStore: { select: { name: true, userId: true } },
        goal: { 
          include: { 
            product: { include: { store: true } }, 
            user: { select: { name: true, id: true, email: true } },
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

// PATCH: Resolve or Reject a Complaint
export async function PATCH(req) {
  try {
    const { 
        complaintId, status, adminNotes, newPrice, 
        processRefund, issueCoupon, couponValue, expiryDays,
        creditWallet, creditAmount
    } = await req.json();

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { 
        goal: { include: { user: true, product: { include: { store: true } } } }, 
        filerStore: true, 
        filerUser: true,
        targetUser: true,
        targetStore: true
      }
    });

    if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let successfulCoupon = null; 
    let pendingNotifications = []; 

    await prisma.$transaction(async (tx) => {
      
      await tx.complaint.update({
        where: { id: complaintId },
        data: { status, adminNotes, resolvedAt: status === "RESOLVED" ? new Date() : null }
      });

      let generatedCouponCode = null;
      const validDays = Number(expiryDays) || 30; 

      // 1. COUPON LOGIC
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

      // 2. FULL WALLET REFUND LOGIC
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
              data: { status: "REFUNDED", netAmount: refundAmount, platformFee: 0, notes: "Refunded to User Wallet" }
            });
          }

          if (complaint.goal.product?.storeId) {
             await tx.refund.create({
                data: {
                   userId: complaint.goal.userId,
                   goalId: complaint.goalId,
                   storeId: complaint.goal.product.storeId,
                   amount: refundAmount,
                   reason: `Dispute Penalty (Complaint: ${complaint.complaintId})`,
                   status: "COMPLETED"
                }
             });

             pendingNotifications.push({
                userId: complaint.goal.product.store.userId,
                email: complaint.goal.product.store.email,
                type: "SYSTEM_ALERT",
                title: "Store Penalty Applied ⚠️",
                message: `A dispute (ID: ${complaint.complaintId}) was resolved in favor of the customer. Rs ${refundAmount.toLocaleString()} has been refunded and deducted from your store revenue.`
             });
          }

          let message = `Your complaint (ID: ${complaint.complaintId}) was resolved. Rs ${refundAmount.toLocaleString()} has been credited to your Digital Wallet.`;
          if (generatedCouponCode) {
            message += ` As an apology, here is a promo code: ${generatedCouponCode} (Discount: ${couponValue}). Valid for ${validDays} days!`;
          }

          pendingNotifications.push({
            userId: complaint.goal.userId,
            email: complaint.goal.user?.email,
            type: "REFUND_ISSUED", 
            title: "Refund Approved 💳",
            message: message
          });
        }
      } 

      // 3. CUSTOM WALLET CREDIT / RIDER PAYOUT LOGIC
      if (creditWallet && status === "RESOLVED" && Number(creditAmount) > 0 && complaint.filerUserId) {
          const payoutAmount = Number(creditAmount);

          const wallet = await tx.wallet.upsert({
            where: { userId: complaint.filerUserId },
            create: { userId: complaint.filerUserId, balance: payoutAmount },
            update: { balance: { increment: payoutAmount } }
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: payoutAmount,
              type: "REFUND_CREDIT", 
              description: `Admin Resolution Payout (Complaint ID: ${complaint.complaintId})`,
              referenceId: complaint.goalId || null
            }
          });

          const riderProfile = await tx.riderProfile.findUnique({
              where: { userId: complaint.filerUserId }
          });
          if (riderProfile) {
              await tx.riderProfile.update({
                  where: { id: riderProfile.id },
                  data: { totalEarnings: { increment: payoutAmount } }
              });
          }

          let message = `Rs ${payoutAmount.toLocaleString()} has been credited to your Digital Wallet for your complaint (ID: ${complaint.complaintId}).`;
          if (generatedCouponCode && !processRefund) { 
            message += ` As an apology, here is a promo code: ${generatedCouponCode} (Discount: ${couponValue}). Valid for ${validDays} days!`;
          }

          pendingNotifications.push({
            userId: complaint.filerUserId,
            email: complaint.filerUser?.email,
            type: "REFUND_ISSUED", 
            title: "Funds Credited 💳",
            message: message
          });
      }

      // 4. PRICE LOCK ADJUSTMENTS
      if (complaint.type === "PRICE_LOCK" && status === "RESOLVED" && newPrice) {
        const adjustedPrice = Number(newPrice);
        
        await tx.goal.update({ 
            where: { id: complaint.goalId }, 
            data: { targetAmount: adjustedPrice } 
        });

        pendingNotifications.push({ 
          userId: complaint.filerStore.userId, 
          type: "SYSTEM_ALERT", 
          title: "Price Lock Updated", 
          message: `New price: Rs ${adjustedPrice.toLocaleString()} (Complaint ID: ${complaint.complaintId})` 
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
      
      // 5. GENERAL RESOLUTION ALERTS
      else {
          const filerUserId = complaint.filerUserId || complaint.filerStore?.userId;
          if (filerUserId && !processRefund && !creditWallet) {
              let message = `Your complaint (ID: ${complaint.complaintId}) titled "${complaint.title}" has been ${status}. Admin Note: ${adminNotes}`;
              
              if (generatedCouponCode && status === "RESOLVED") {
                 message = `Your complaint (ID: ${complaint.complaintId}) was resolved. As an apology, here is a promo code: ${generatedCouponCode} (Discount: ${couponValue}). Valid for ${validDays} days! Admin Note: ${adminNotes}`;
              }

              pendingNotifications.push({ 
                userId: filerUserId, 
                email: complaint.filerUser?.email,
                type: status === "RESOLVED" ? "COMPLAINT_RESOLVED" : "SYSTEM_ALERT", 
                title: status === "RESOLVED" ? "Complaint Resolved ✅" : "Complaint Rejected ❌", 
                message: message 
              });
          }

          if (status === "RESOLVED") {
             const warningTargetId = complaint.targetUserId || complaint.targetStore?.userId;
             if (warningTargetId) {
                pendingNotifications.push({ 
                  userId: warningTargetId, 
                  email: complaint.targetUser?.email,
                  type: "SYSTEM_ALERT", 
                  title: "Official Admin Warning ⚠️", 
                  message: `A complaint (ID: ${complaint.complaintId}) against your account was reviewed. Admin Note: ${adminNotes}` 
                });
             }
          }
      }
    }); 
    
    // Execute Notifications
    for (const notif of pendingNotifications) {
      await sendNotification({
        ...notif, 
        notifyInApp: true, 
        notifyEmail: !!notif.email 
      });
    }

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