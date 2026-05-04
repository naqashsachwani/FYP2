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
        filerUser: true, 
        filerStore: { select: { name: true, logo: true } },
        filerRider: { include: { user: true } },
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
        filerRider: { include: { user: true } },
        targetUser: true,
        targetStore: true
      }
    });

    if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const displayId = complaint.complaintId || complaint.id.slice(-6).toUpperCase();

    let successfulCoupon = null; 
    let pendingNotifications = []; 

    await prisma.$transaction(async (tx) => {
      
      await tx.complaint.update({
        where: { id: complaintId },
        data: { status, adminNotes, resolvedAt: status === "RESOLVED" ? new Date() : null }
      });

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
            discount: Number(couponValue), usageLimit: 1, forNewUser: false, forMember: false, isPublic: false, userId: complaint.filerUserId, expiresAt: expiryDate
          }
        });
        successfulCoupon = newCoupon; 
      }

      if (processRefund && status === "RESOLVED" && complaint.goal) {
        const refundAmount = Number(complaint.goal.saved);

        if (refundAmount > 0) {
          await tx.goal.update({ where: { id: complaint.goalId }, data: { status: "REFUNDED" } });

          const wallet = await tx.wallet.upsert({
            where: { userId: complaint.goal.userId },
            create: { userId: complaint.goal.userId, balance: refundAmount },
            update: { balance: { increment: refundAmount } }
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id, amount: refundAmount, type: "REFUND_CREDIT", 
              description: `Admin Resolution Refund for ${complaint.goal.product?.name || "Goal"}`, referenceId: complaint.goalId
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
                   userId: complaint.goal.userId, goalId: complaint.goalId, storeId: complaint.goal.product.storeId, amount: refundAmount,
                   reason: `Dispute Penalty (Ticket ID: ${displayId})`, status: "COMPLETED"
                }
             });

             pendingNotifications.push({
                userId: complaint.goal.product.store.userId, email: complaint.goal.product.store.email, type: "SYSTEM_ALERT",
                title: `Store Penalty Applied (Ticket ${displayId}) ⚠️`,
                message: `A dispute (Ticket ID: ${displayId}) was resolved in favor of the customer. Rs ${refundAmount.toLocaleString()} has been refunded and deducted from your store revenue.`
             });
          }

          let message = `Your complaint (Ticket ID: ${displayId}) was resolved. Rs ${refundAmount.toLocaleString()} has been credited to your Digital Wallet.`;
          if (generatedCouponCode) {
            message += ` As an apology, here is a promo code: ${generatedCouponCode} (Discount: ${couponValue}). Valid for ${validDays} days!`;
          }

          pendingNotifications.push({
            userId: complaint.goal.userId, email: complaint.goal.user?.email, type: "REFUND_ISSUED", 
            title: `Refund Approved (Ticket ${displayId}) 💳`, message: message
          });
        }
      } 

      if (creditWallet && status === "RESOLVED" && Number(creditAmount) > 0 && (complaint.filerUserId || complaint.filerRiderId)) {
          const payoutAmount = Number(creditAmount);

          if (complaint.filerRiderId) {
              await tx.riderProfile.update({
                  where: { id: complaint.filerRiderId },
                  data: { walletBalance: { increment: payoutAmount }, totalEarnings: { increment: payoutAmount } }
              });
              await tx.riderPayout.create({
                data: {
                  riderId: complaint.filerRiderId, amount: payoutAmount, type: "EARNING", 
                  description: `Admin Support Resolution (Ticket ID: ${displayId})`, referenceId: complaint.goalId || null
                }
              });
          } else {
              const wallet = await tx.wallet.upsert({
                where: { userId: complaint.filerUserId },
                create: { userId: complaint.filerUserId, balance: payoutAmount },
                update: { balance: { increment: payoutAmount } }
              });
              await tx.walletTransaction.create({
                data: {
                  walletId: wallet.id, amount: payoutAmount, type: "REFUND_CREDIT", 
                  description: `Admin Resolution Payout (Ticket ID: ${displayId})`, referenceId: complaint.goalId || null
                }
              });
          }

          let message = `Rs ${payoutAmount.toLocaleString()} has been credited to your Digital Wallet for your complaint (Ticket ID: ${displayId}).`;
          if (generatedCouponCode && !processRefund) { 
            message += ` As an apology, here is a promo code: ${generatedCouponCode} (Discount: ${couponValue}). Valid for ${validDays} days!`;
          }

          pendingNotifications.push({
            userId: complaint.filerUserId || complaint.filerRider?.userId, 
            email: complaint.filerUser?.email || complaint.filerRider?.user?.email,
            type: "REFUND_ISSUED", 
            title: `Funds Credited (Ticket ${displayId}) 💳`,
            message: message
          });
      }

      if (complaint.type === "PRICE_LOCK" && status === "RESOLVED" && newPrice) {
        const adjustedPrice = Number(newPrice);
        await tx.goal.update({ where: { id: complaint.goalId }, data: { targetAmount: adjustedPrice } });

        pendingNotifications.push({ 
          userId: complaint.filerStore.userId, type: "SYSTEM_ALERT", title: `Price Lock Updated (Ticket ${displayId})`, 
          message: `New price: Rs ${adjustedPrice.toLocaleString()} (Ticket ID: ${displayId})` 
        });

        pendingNotifications.push({ 
          userId: complaint.goal.userId, email: complaint.goal.user?.email, type: "SYSTEM_ALERT", title: "Price Adjustment Alert", 
          message: `The price for your goal has been adjusted to Rs ${adjustedPrice.toLocaleString()} as per store request.`, goalId: complaint.goalId 
        });
      } 
      else {
          // ✅ SAFE EMAIL RESOLUTION: Grabs the exact email of whoever filed it
          const filerUserId = complaint.filerUserId || complaint.filerStore?.userId || complaint.filerRider?.userId;
          const filerEmail = complaint.filerUser?.email || complaint.filerStore?.email || complaint.filerRider?.user?.email;

          if (filerUserId && !processRefund && !creditWallet) {
              let message = `Your support ticket (ID: ${displayId}) titled "${complaint.title}" has been ${status}. Admin Note: ${adminNotes}`;
              if (generatedCouponCode && status === "RESOLVED") {
                 message = `Your support ticket (ID: ${displayId}) was resolved. As an apology, here is a promo code: ${generatedCouponCode} (Discount: ${couponValue}). Valid for ${validDays} days! Admin Note: ${adminNotes}`;
              }
              pendingNotifications.push({ 
                userId: filerUserId, 
                email: filerEmail, // Sent to User, Store, OR Rider!
                type: status === "RESOLVED" ? "COMPLAINT_RESOLVED" : "SYSTEM_ALERT", 
                title: status === "RESOLVED" ? `Ticket ${displayId} Resolved ✅` : `Ticket ${displayId} Rejected ❌`, 
                message: message 
              });
          }

          if (status === "RESOLVED") {
             const warningTargetId = complaint.targetUserId || complaint.targetStore?.userId;
             const targetEmail = complaint.targetUser?.email || complaint.targetStore?.email;
             
             if (warningTargetId) {
                pendingNotifications.push({ 
                  userId: warningTargetId, 
                  email: targetEmail, // Sent to User OR Store
                  type: "SYSTEM_ALERT", 
                  title: `Official Admin Warning (Ticket ${displayId}) ⚠️`, 
                  message: `A complaint (Ticket ID: ${displayId}) against your account was reviewed. Admin Note: ${adminNotes}` 
                });
             }
          }
      }
    }); 
    
    // Dispatch all notifications via App + Email
    for (const notif of pendingNotifications) {
      await sendNotification({ ...notif, notifyInApp: true, notifyEmail: !!notif.email });
    }
    
    if (successfulCoupon) {
      await inngest.send({ name: "app/coupon.expired", data: { code: successfulCoupon.code, expires_at: successfulCoupon.expiresAt } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}