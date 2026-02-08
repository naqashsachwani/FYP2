import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  const { id } = await params; // Can be EscrowID or RefundRequestID
  const { userId } = getAuth(req);

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { action } = await req.json(); 

    // ====================================================
    // ✅ CASE 1: RELEASE FUNDS (Product DELIVERED)
    // ----------------------------------------------------
    // Logic: Apply 5% Platform Fee.
    // ====================================================
    if (action === "RELEASE") {
        const escrow = await prisma.escrow.findUnique({ where: { id } });
        if (!escrow) return NextResponse.json({ error: "Escrow record not found" }, { status: 404 });

        const totalAmount = Number(escrow.amount);
        
        // --- 5% FEE APPLIES HERE ONLY ---
        const platformFee = totalAmount * 0.05; 
        const netAmount = totalAmount - platformFee;

        await prisma.escrow.update({
            where: { id },
            data: {
                status: "RELEASED",
                platformFee, // Records the 5% fee
                netAmount,   // Records the 95% payout to store
                releasedAt: new Date(),
                releasedBy: userId,
                notes: "Released to Store (5% Platform Fee Applied)"
            }
        });
        
        return NextResponse.json({ success: true, message: "Funds Released" });
    }

    // ====================================================
    // ❌ CASE 2: REFUND FUNDS (Goal CANCELLED)
    // ----------------------------------------------------
    // Logic: Apply 20% Penalty (10% Admin, 10% Store).
    // NO 5% Platform Fee is added here.
    // ====================================================
    if (action === "REFUND") {
        const request = await prisma.refundRequest.findUnique({ 
            where: { id }, 
            include: { goal: { include: { product: true } } }
        });
        
        if (!request) return NextResponse.json({ error: "Refund request not found" }, { status: 404 });

        const goalId = request.goalId;
        const totalAmount = Number(request.amount);
        const realStoreId = request.goal?.product?.storeId; 
        
        // --- PENALTY LOGIC ---
        // Penalty: 20% (Taken from user)
        // Split: 10% to Admin, 10% to Store
        const penaltyRate = totalAmount > 0 ? 0.20 : 0; 
        
        const adminShareRate = 0.10; // 10%
        const userRefundRate = 1 - penaltyRate; // 80% (User gets back)
        
        const adminFee = totalAmount * adminShareRate; 
        const userRefundAmount = totalAmount * userRefundRate;

        // Execute Updates
        await prisma.$transaction(async (tx) => {
            // A. Update Request
            await tx.refundRequest.update({
                where: { id },
                data: {
                    status: "APPROVED",
                    processedAt: new Date(),
                    adminId: userId,
                    responseNote: `Refund Approved. 20% Penalty Applied (10% Admin, 10% Store).`
                }
            });

            // B. Create Refund Record (User View)
            if (realStoreId) {
                await tx.refund.create({
                    data: {
                        userId: request.userId,
                        goalId: goalId,
                        storeId: realStoreId,
                        amount: userRefundAmount, // 80% back to user
                        reason: request.reason || "Goal Cancellation",
                        status: "COMPLETED",
                    }
                });
            }

            // C. Update Escrow (Money Movement)
            const escrowRecord = await tx.escrow.findUnique({ where: { goalId: goalId } });
            
            if (escrowRecord) {
                await tx.escrow.update({
                    where: { id: escrowRecord.id },
                    data: {
                        status: "REFUNDED",
                        platformFee: adminFee, // Records Admin's 10% Share
                        netAmount: userRefundAmount, // Records User's 80% Refund
                        releasedAt: new Date(),
                        releasedBy: userId,
                        notes: `Refunded. Split: 80% User, 10% Admin, 10% Store.`
                    }
                });
            }

            // D. Update Goal
            await tx.goal.update({
                where: { id: goalId },
                data: { status: "REFUNDED" }
            });
        });

        return NextResponse.json({ success: true, message: "Refund Processed" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Process Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}