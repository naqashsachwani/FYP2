import prisma from "@/lib/prisma"; 
import { getAuth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server"; 
import crypto from "crypto"; 
import { inngest } from "@/inngest/client"; 
import { sendNotification } from "@/lib/sendNotification"; 

export async function GET(req) {
  try {
    // Authenticate the request
    const { userId } = getAuth(req);
    
    // Fetch data from PostgreSQL via Prisma
    const complaints = await prisma.complaint.findMany({
      include: {
        filerUser: { select: { name: true, image: true, email: true } },
        filerStore: { select: { name: true, logo: true } },
        targetUser: { select: { name: true, email: true } },
        targetStore: { select: { name: true, userId: true } },
        goal: { 
          include: { 
            product: true,
            user: { select: { name: true, id: true, email: true } }, // ✅ Ensure we grab the buyer's email for notifications later
            escrow: true 
          } 
        }
      },
      // Sort so the newest complaints are at the top of the admin's queue
      orderBy: { createdAt: 'desc' }
    });

    // Return the data payload
    return NextResponse.json({ complaints });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
  }
}

// PATCH: Resolve or Reject a Complaint
export async function PATCH(req) {
  try {
    // Parse the incoming JSON payload from the admin's form submission
    const { complaintId, status, adminNotes, newPrice, processRefund, issueCoupon, couponValue, expiryDays } = await req.json();

    // Fetch the existing complaint record to verify it exists and to grab necessary related IDs
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { 
        goal: { include: { user: true } }, // Ensure user email is available for notifications
        filerStore: true, 
        filerUser: true,
        targetUser: true
      }
    });

    // If the complaint ID is invalid, stop execution
    if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // --- State Variables for Post-Transaction Actions ---
    let successfulCoupon = null; 
    let pendingNotifications = []; 

    await prisma.$transaction(async (tx) => {
      
      await tx.complaint.update({
        where: { id: complaintId },
        data: { status, adminNotes, resolvedAt: status === "RESOLVED" ? new Date() : null }
      });

      let generatedCouponCode = null;
      const validDays = Number(expiryDays) || 30; // Fallback to 30 days if no input was provided

      if (issueCoupon && status === "RESOLVED" && complaint.filerUserId) {
        generatedCouponCode = `SORRY-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
        
        // Calculate exact expiration Date object
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + validDays);

        // Create the coupon record in the database
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

      if (processRefund && status === "RESOLVED" && complaint.goal) {
        const refundAmount = Number(complaint.goal.saved);

        if (refundAmount > 0) {
          // Mark the savings goal as dead/refunded
          await tx.goal.update({
            where: { id: complaint.goalId },
            data: { status: "REFUNDED" }
          });

          // Update the User's Digital Wallet
          const wallet = await tx.wallet.upsert({
            where: { userId: complaint.goal.userId },
            create: { userId: complaint.goal.userId, balance: refundAmount },
            update: { balance: { increment: refundAmount } }
          });

          // Create a Wallet Transaction Ledger entry 
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: refundAmount,
              type: "REFUND_CREDIT", // Must match Prisma ENUM
              description: `Admin Resolution Refund for ${complaint.goal.product?.name || "Goal"}`,
              referenceId: complaint.goalId
            }
          });

          // Update the Escrow Account to reflect that funds were drained
          const escrow = await tx.escrow.findUnique({ where: { goalId: complaint.goalId } });
          if (escrow) {
            await tx.escrow.update({
              where: { id: escrow.id },
              // Note: Platform fee is 0 because the platform takes no cut on admin-forced full refunds
              data: { status: "REFUNDED", netAmount: refundAmount, platformFee: 0, notes: "Refunded to User" }
            });
          }

          let message = `Your complaint was resolved. Rs ${refundAmount.toLocaleString()} has been added to your Wallet.`;
          // If a coupon was also generated, append it to the same notification message
          if (generatedCouponCode) {
            message += ` As an apology, here is a promo code: ${generatedCouponCode} (Discount: ${couponValue}). Valid for ${validDays} days!`;
          }

          pendingNotifications.push({
            userId: complaint.goal.userId,
            email: complaint.goal.user?.email, // Only available because we used include: { user: true } in the first query
            type: "REFUND_ISSUED", 
            title: "Refund Approved ",
            message: message
          });
        }
      } 

      // Check if the ticket was specifically a PRICE_LOCK request, it was approved, and a new price was provided
      else if (complaint.type === "PRICE_LOCK" && status === "RESOLVED" && newPrice) {
        const adjustedPrice = Number(newPrice);
        
        // Update the target goal amount in the database
        await tx.goal.update({ 
            where: { id: complaint.goalId }, 
            data: { targetAmount: adjustedPrice } 
        });

        //  Queue Notification to the Store Owner (confirming their request succeeded)
        pendingNotifications.push({ 
          userId: complaint.filerStore.userId, 
          type: "SYSTEM_ALERT", 
          title: "Price Lock Updated", 
          message: `New price: Rs ${adjustedPrice.toLocaleString()}` 
        });

        //  Queue Notification to the User (alerting them that their target savings goal has increased due to inflation/store request)
        pendingNotifications.push({ 
          userId: complaint.goal.userId, 
          email: complaint.goal.user?.email,
          type: "SYSTEM_ALERT", 
          title: "Price Adjustment Alert", 
          message: `The price for your goal has been adjusted to Rs ${adjustedPrice.toLocaleString()}`, 
          goalId: complaint.goalId 
        });
      } 
      
      else {
          // Identify who filed the complaint (could be a user or a store)
          const filerUserId = complaint.filerUserId || complaint.filerStore?.userId;
          if (filerUserId) {
              let message = `Your complaint "${complaint.title}" is now ${status}. Admin Note: ${adminNotes}`;
              
              // If a coupon was generated for a standard complaint, append it
              if (generatedCouponCode && status === "RESOLVED") {
                 message = `Your complaint was resolved. As an apology, here is a promo code: ${generatedCouponCode} (Discount: ${couponValue}). Valid for ${validDays} days! Admin Note: ${adminNotes}`;
              }

              // Queue Notification to the person who filed the complaint letting them know a decision was reached
              pendingNotifications.push({ 
                userId: filerUserId, 
                email: complaint.filerUser?.email,
                type: status === "RESOLVED" ? "COMPLAINT_RESOLVED" : "SYSTEM_ALERT", 
                title: `Complaint ${status}`, 
                message: message 
              });
          }

          // If the complaint was resolved (meaning the admin agreed with the filer), 
          if (status === "RESOLVED") {
             const warningTargetId = complaint.targetUserId || complaint.targetStore?.userId;
             if (warningTargetId) {
                // Queue Notification to the reported party
                pendingNotifications.push({ 
                  userId: warningTargetId, 
                  email: complaint.targetUser?.email,
                  type: "SYSTEM_ALERT", 
                  title: " Official Admin Warning", 
                  message: `A complaint against your account was reviewed. Admin Note: ${adminNotes}` 
                });
             }
          }
      }
    }); // <-- End of Prisma Transaction Block
    
    // Send all queued notifications using a simple loop
    for (const notif of pendingNotifications) {
      await sendNotification({
        ...notif, 
        notifyInApp: true, 
        notifyEmail: !!notif.email 
      });
    }

    // Schedule coupon expiration in Inngest
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