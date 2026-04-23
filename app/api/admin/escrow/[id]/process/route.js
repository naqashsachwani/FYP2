import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authAdmin from "@/middlewares/authAdmin";
import { sendNotification } from "@/lib/sendNotification";
import { writeSecurityAuditLog } from "@/lib/security/auditLog";
import { getRequestContext } from "@/lib/security/requestContext";
import { checkRateLimit } from "@/lib/security/rateLimit";

export async function POST(req, { params }) {
  const { id } = await params;
  const { userId } = getAuth(req);
  const context = getRequestContext(req, userId);

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = await authAdmin(userId);
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rateLimit = checkRateLimit({
      key: `admin-escrow-process:${userId}:${context.ipAddress}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many admin financial actions. Please try again later." }, { status: 429 });
    }

    const { action } = await req.json();

    if (action === "RELEASE") {
      const escrow = await prisma.escrow.findUnique({
        where: { id },
        include: {
          goal: {
            include: {
              product: { include: { store: { include: { user: true } } } }
            }
          }
        }
      });

      if (!escrow) return NextResponse.json({ error: "Escrow record not found" }, { status: 404 });

      const totalAmount = Number(escrow.amount);
      const platformFee = totalAmount * 0.05;
      const netAmount = totalAmount - platformFee;

      await prisma.escrow.update({
        where: { id },
        data: {
          status: "RELEASED",
          platformFee,
          netAmount,
          releasedAt: new Date(),
          releasedBy: userId,
          notes: "Released to Store (5% Platform Fee Applied)"
        }
      });

      const storeOwner = escrow.goal?.product?.store?.user;
      if (storeOwner) {
        await sendNotification({
          userId: storeOwner.id,
          email: storeOwner.email,
          title: "Funds Released!",
          message: `Rs ${netAmount.toLocaleString()} has been successfully released to your account for the sale of ${escrow.goal?.product?.name}.`,
          type: "SYSTEM_ALERT",
          notifyInApp: true,
          notifyEmail: true
        });
      }

      await writeSecurityAuditLog({
        action: "ADMIN_ESCROW_RELEASE",
        actorUserId: userId,
        entityType: "Escrow",
        entityId: id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { netAmount, platformFee },
      });

      return NextResponse.json({ success: true, message: "Funds Released" });
    }

    if (action === "REFUND") {
      const request = await prisma.refundRequest.findUnique({
        where: { id },
        include: { user: true, goal: { include: { product: true } } }
      });

      if (!request) return NextResponse.json({ error: "Refund request not found" }, { status: 404 });

      const goalId = request.goalId;
      const totalAmount = Number(request.amount);
      const realStoreId = request.goal?.product?.storeId;

      const penaltyRate = totalAmount > 0 ? 0.20 : 0;
      const adminShareRate = 0.10;
      const userRefundRate = 1 - penaltyRate;

      const adminFee = totalAmount * adminShareRate;
      const userRefundAmount = totalAmount * userRefundRate;

      await prisma.$transaction(async (tx) => {
        await tx.refundRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            processedAt: new Date(),
            adminId: userId,
            responseNote: "Refund Approved. 20% Penalty Applied."
          }
        });

        if (realStoreId) {
          await tx.refund.create({
            data: {
              userId: request.userId,
              goalId,
              storeId: realStoreId,
              amount: userRefundAmount,
              reason: request.reason || "Goal Cancellation",
              status: "COMPLETED",
            }
          });
        }

        const escrowRecord = await tx.escrow.findUnique({ where: { goalId } });
        if (escrowRecord) {
          await tx.escrow.update({
            where: { id: escrowRecord.id },
            data: {
              status: "REFUNDED",
              platformFee: adminFee,
              netAmount: userRefundAmount,
              releasedAt: new Date(),
              releasedBy: userId,
              notes: "Refunded. Split: 80% User, 10% Admin, 10% Store."
            }
          });
        }

        await tx.goal.update({
          where: { id: goalId },
          data: { status: "REFUNDED" }
        });

        const wallet = await tx.wallet.upsert({
          where: { userId: request.userId },
          create: {
            userId: request.userId,
            balance: userRefundAmount
          },
          update: {
            balance: { increment: userRefundAmount }
          }
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: userRefundAmount,
            type: "REFUND_CREDIT",
            description: `Refund for Cancelled Goal (${request.goal?.product?.name || "Item"})`,
            referenceId: goalId
          }
        });
      });

      if (request.user) {
        await sendNotification({
          userId: request.userId,
          email: request.user.email,
          title: "Refund Processed",
          message: `Rs ${userRefundAmount.toLocaleString()} has been credited to your Digital Wallet for your cancelled goal.`,
          type: "REFUND_ISSUED",
          goalId,
          notifyInApp: true,
          notifyEmail: true
        });
      }

      await writeSecurityAuditLog({
        action: "ADMIN_ESCROW_REFUND",
        actorUserId: userId,
        entityType: "RefundRequest",
        entityId: id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { goalId, userRefundAmount, adminFee },
      });

      return NextResponse.json({ success: true, message: "Refund Processed & Wallet Credited" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Process Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
