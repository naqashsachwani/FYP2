import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authAdmin from "@/middlewares/authAdmin";
import { sendNotification } from "@/lib/sendNotification";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      stores,
      riders,
      history,
      revenueAgg,
      riderPayoutsAgg,
      storeBonusesAgg
    ] = await prisma.$transaction([
      prisma.store.findMany({
        select: { id: true, name: true, userId: true, email: true },
      }),
      prisma.riderProfile.findMany({
        include: { user: true },
      }),
      prisma.manualPayout.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.escrow.aggregate({
        _sum: { platformFee: true },
        where: { status: { in: ["RELEASED", "REFUNDED"] } }
      }),
      prisma.riderPayout.aggregate({
        _sum: { amount: true },
        where: { status: "TRANSFERRED" }
      }),
      prisma.storePayout.aggregate({
        _sum: { amount: true },
        where: { type: "BONUS" }
      })
    ]);

    const formattedRiders = riders.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.user?.name || "Unknown",
      email: r.user?.email || "",
    }));

    const grossRevenue = Number(revenueAgg._sum.platformFee) || 0;
    const totalRiderCosts = Number(riderPayoutsAgg._sum.amount) || 0;
    const totalStoreBonuses = Number(storeBonusesAgg._sum.amount) || 0;
    const netRevenue = grossRevenue - totalRiderCosts - totalStoreBonuses;

    return NextResponse.json({
      stores,
      riders: formattedRiders,
      history,
      netRevenue
    });

  } catch (error) {
    console.error("Fetch Manual Payouts Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { isBulk, amount, reason } = body;
    const payAmount = Number(amount);

    if (payAmount <= 0) {
      return NextResponse.json({ error: "Invalid Amount" }, { status: 400 });
    }

    // --- 1. REVENUE VALIDATION ---
    const [revenueAgg, riderPayoutsAgg, storeBonusesAgg] = await prisma.$transaction([
      prisma.escrow.aggregate({
        _sum: { platformFee: true },
        where: { status: { in: ["RELEASED", "REFUNDED"] } }
      }),
      prisma.riderPayout.aggregate({
        _sum: { amount: true },
        where: { status: "TRANSFERRED" }
      }),
      prisma.storePayout.aggregate({
        _sum: { amount: true },
        where: { type: "BONUS" }
      })
    ]);

    const grossRevenue = Number(revenueAgg._sum.platformFee) || 0;
    const totalRiderCosts = Number(riderPayoutsAgg._sum.amount) || 0;
    const totalStoreBonuses = Number(storeBonusesAgg._sum.amount) || 0;
    const netRevenue = grossRevenue - totalRiderCosts - totalStoreBonuses;
    
    const currentDate = new Date().toLocaleDateString("en-GB");

    // ==========================================
    // SCENARIO A: BULK BONUS LOGIC
    // ==========================================
    if (isBulk) {
      const { targetGroup } = body; // "STORE" or "RIDER"
      
      let recipients = [];
      
      if (targetGroup === "STORE") {
        recipients = await prisma.store.findMany({
          select: { id: true, name: true, userId: true, email: true }
        });
      } else {
        recipients = await prisma.riderProfile.findMany({
          include: { user: true }
        });
      }

      const totalRequired = payAmount * recipients.length;
      
      if (totalRequired > netRevenue) {
        return NextResponse.json({ error: "Insufficient Platform Revenue for this bulk operation" }, { status: 400 });
      }

      // Process all database changes in a single transaction
      await prisma.$transaction(async (tx) => {
        for (const r of recipients) {
          const recName = targetGroup === "STORE" ? r.name : (r.user?.name || "Rider");
          const recId = r.id;

          await tx.manualPayout.create({
            data: {
              adminId: userId,
              recipientType: targetGroup,
              recipientId: recId,
              recipientName: recName,
              amount: payAmount,
              reason
            }
          });

          if (targetGroup === "STORE") {
            await tx.storePayout.create({
              data: {
                storeId: recId,
                amount: payAmount,
                type: "BONUS",
                status: "COMPLETED",
                description: `Bulk Bonus: ${reason}`
              }
            });
          } else {
            await tx.riderProfile.update({
              where: { id: recId },
              data: {
                walletBalance: { increment: payAmount },
                totalEarnings: { increment: payAmount }
              }
            });
            
            await tx.riderPayout.create({
              data: {
                riderId: recId,
                amount: payAmount,
                type: "EARNING",
                status: "TRANSFERRED",
                description: `Bulk Bonus: ${reason}`
              }
            });
          }
        }
      });

      // Fire mass notifications
      const notifications = recipients.map(r => {
        const recEmail = targetGroup === "STORE" ? r.email : r.user?.email;
        const recName = targetGroup === "STORE" ? r.name : (r.user?.name || "Rider");
        const recUserId = targetGroup === "STORE" ? r.userId : r.userId;

        if (recEmail) {
          const detailedMessage = `Hello ${recName},\n\nWe are thrilled to inform you that an administrative bulk bonus has been successfully credited to your DreamSaver account!\n\nTransaction Details:\n• Amount Credited: Rs ${payAmount.toLocaleString()}\n• Reason: ${reason}\n• Date: ${currentDate}\n\nThis amount is now available in your Ledger History and has been added to your Available Balance immediately.\n\nThank you for your continued partnership with DreamSaver!`;
          
          return sendNotification({
            userId: recUserId,
            email: recEmail,
            title: "Annual Bulk Bonus Received! 🎉",
            message: detailedMessage,
            type: "SYSTEM_ALERT",
            notifyInApp: true,
            notifyEmail: true,
          });
        }
      });

      await Promise.all(notifications);
      
      return NextResponse.json({ success: true, count: recipients.length });
    }

    // ==========================================
    // SCENARIO B: INDIVIDUAL BONUS LOGIC
    // ==========================================
    const { recipientType, recipientId, recipientName, recipientUserId, recipientEmail } = body;

    if (payAmount > netRevenue) {
      return NextResponse.json({ error: "Insufficient Platform Revenue" }, { status: 400 });
    }

    let transactionId = "";

    await prisma.$transaction(async (tx) => {
      const auditLog = await tx.manualPayout.create({
        data: {
          adminId: userId,
          recipientType,
          recipientId,
          recipientName,
          amount: payAmount,
          reason,
        },
      });
      
      transactionId = auditLog.id;

      if (recipientType === "STORE") {
        await tx.storePayout.create({
          data: {
            storeId: recipientId,
            amount: payAmount,
            type: "BONUS",
            status: "COMPLETED",
            description: `Admin Bonus/Adjustment: ${reason}`,
          },
        });
      } else if (recipientType === "RIDER") {
        await tx.riderProfile.update({
          where: { id: recipientId },
          data: {
            walletBalance: { increment: payAmount },
            totalEarnings: { increment: payAmount },
          },
        });

        await tx.riderPayout.create({
          data: {
            riderId: recipientId,
            amount: payAmount,
            type: "EARNING",
            status: "TRANSFERRED",
            description: `Admin Bonus/Adjustment: ${reason}`,
          },
        });
      }
    });

    if (recipientEmail) {
      const detailedMessage = `Hello ${recipientName},\n\nWe are pleased to inform you that an administrative payment has been successfully credited to your DreamSaver account.\n\nTransaction Details:\n• Amount Credited: Rs ${payAmount.toLocaleString()}\n• Reason: ${reason}\n• Date: ${currentDate}\n• Reference ID: ${transactionId.slice(-8).toUpperCase()}\n\nThis amount is now available in your Ledger History and has been added to your Available Balance immediately.\n\nThank you for your continued partnership with DreamSaver!`;

      await sendNotification({
        userId: recipientUserId,
        email: recipientEmail,
        title: "Bonus / Extra Payment Received! 🎁",
        message: detailedMessage,
        type: "SYSTEM_ALERT",
        notifyInApp: true,
        notifyEmail: true,
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Payout Error:", error);
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
  }
}