import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/sendNotification"; 
import { writeSecurityAuditLog } from "@/lib/security/auditLog";
import { getRequestContext } from "@/lib/security/requestContext";
import { checkRateLimit } from "@/lib/security/rateLimit";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const context = getRequestContext(req, userId);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rateLimit = checkRateLimit({
      key: `wallet-withdraw:${userId}:${context.ipAddress}`,
      limit: 3,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many withdrawal attempts. Please try again later." }, { status: 429 });
    }

    const { amount, payoutMethod, accountName, accountNumber } = await req.json();
    const withdrawAmount = Number(amount);
    const safeAccountNumber = String(accountNumber || "").trim();
    const safeAccountName = String(accountName || "").trim();
    const safePayoutMethod = String(payoutMethod || "").trim();

    if (!withdrawAmount || withdrawAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    
    if (!safePayoutMethod || !safeAccountName || !safeAccountNumber) {
      return NextResponse.json({ error: "Please provide all account details." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9\-\s]{6,34}$/.test(safeAccountNumber)) {
      return NextResponse.json({ error: "Invalid account number format." }, { status: 400 });
    }

    // 1. Check wallet balance
    const wallet = await prisma.wallet.findUnique({ 
        where: { userId },
        include: { user: true } //  INCLUDE USER FOR EMAIL
    });
    
    if (!wallet || Number(wallet.balance) < withdrawAmount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    // 2. Update the local database
    await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: withdrawAmount } },
      });

      // Log the successful withdrawal transfer
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: withdrawAmount, 
          type: "WITHDRAWAL",
          description: `Direct Transfer to ${safePayoutMethod} (${safeAccountNumber} - ${safeAccountName})`,
        },
      });
    });

    // FIRE ENGINE: Notify user that the withdrawal was successfully processed
    if (wallet.user) {
        await sendNotification({
            userId: wallet.user.id,
            email: wallet.user.email,
            title: "Withdrawal Successful ",
            message: `Your withdrawal of Rs ${withdrawAmount.toLocaleString()} has been successfully transferred to your ${safePayoutMethod} account ending in ${safeAccountNumber.slice(-4)}.`,
            type: "SYSTEM_ALERT",
            notifyInApp: true,
            notifyEmail: true
        });
    }

    await writeSecurityAuditLog({
      action: "WALLET_WITHDRAWAL",
      actorUserId: userId,
      entityType: "Wallet",
      entityId: wallet.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        amount: withdrawAmount,
        payoutMethod: safePayoutMethod,
        last4: safeAccountNumber.slice(-4),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Withdrawal processed successfully.",
    });

  } catch (error) {
    console.error("Withdrawal Error:", error);
    return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 });
  }
}
