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

    const {
      recipientType,
      recipientId,
      recipientName,
      recipientUserId,
      recipientEmail,
      amount,
      reason,
    } = await req.json();

    const payAmount = Number(amount);

    if (payAmount <= 0) {
      return NextResponse.json({ error: "Invalid Amount" }, { status: 400 });
    }

    let transactionId = "";

    await prisma.$transaction(async (tx) => {
      // 1. Log the Action in Admin Audit Ledger
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

      // 2. Distribute to Specific Party
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

    // 3. Send Detailed Email & In-App Notification (CLEAN PLAIN-TEXT FORMATTING)
    if (recipientEmail) {
      const currentDate = new Date().toLocaleDateString("en-GB");

      const detailedMessage = `Hello ${recipientName},\n\nWe are pleased to inform you that an administrative payment has been successfully credited to your DreamSaver account.\n\nTransaction Details:\n• Amount Credited: Rs ${payAmount.toLocaleString()}\n• Reason: ${reason}\n• Date: ${currentDate}\n• Reference ID: ${transactionId.slice(-8).toUpperCase()}\n\nThis amount is now available in your Ledger History and has been added to your Available Balance immediately.\n\nThank you for your continued partnership with DreamSaver!`;

      await sendNotification({
        userId: recipientUserId,
        email: recipientEmail,
        title: "Bonus / Extra Payment Received! ",
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