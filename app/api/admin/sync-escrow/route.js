import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Fetch ALL goals (even those with 0 saved)
    const goals = await prisma.goal.findMany({
      include: {
        escrow: true // Check if escrow already exists
      }
    });

    let createdCount = 0;
    let updatedCount = 0;

    // 2. Loop through goals and create Escrow records
    for (const goal of goals) {
      let status = "HELD";
      
      // Map existing goal status to Escrow status
      if (goal.status === "REFUNDED") status = "REFUNDED";
      // Note: We keep "COMPLETED" goals as "HELD" so you can test the "Release" button.

      if (!goal.escrow) {
        // Create missing Escrow Record
        await prisma.escrow.create({
          data: {
            goalId: goal.id,
            // Link to order if it exists (optional logic based on your app)
            amount: goal.saved,
            status: status, // Defaults to HELD so it shows in your dashboard
            currency: "PKR"
          }
        });
        createdCount++;
      } else {
        // Update existing record to match goal amount
        if (Number(goal.escrow.amount) !== Number(goal.saved)) {
            await prisma.escrow.update({
                where: { id: goal.escrow.id },
                data: { amount: goal.saved }
            });
            updatedCount++;
        }
      }
    }

    return NextResponse.json({ 
      message: "Sync Successful", 
      created: createdCount, 
      updated: updatedCount,
      totalGoals: goals.length 
    });

  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}