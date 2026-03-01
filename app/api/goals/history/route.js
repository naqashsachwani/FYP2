import prisma from "@/lib/prisma"; 
import { getAuth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server"; 

const normalize = (obj) => JSON.parse(
  JSON.stringify(obj, (key, value) => 
    (typeof value === 'object' && value !== null && value.type === 'Decimal') 
      ? Number(value) 
      : value
  )
);

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) 
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    // Fetch only Cancelled, Refunded, or Delivered goals
    const goals = await prisma.goal.findMany({
      where: { 
        userId,
        OR: [
          { status: { in: ["CANCELLED", "REFUNDED"] } },
          { delivery: { status: "DELIVERED" } }
        ]
      },
      include: { 
        product: true, 
        delivery: true 
      },
      orderBy: { updatedAt: "desc" }, 
    });

    const formattedGoals = goals.map(goal => ({
      ...goal,
      saved: Number(goal.saved),
      targetAmount: Number(goal.targetAmount),
    }));

    return NextResponse.json({ goals: normalize(formattedGoals) });
  } catch (err) {
    console.error("GET /api/goals/history error:", err);
    return NextResponse.json({ error: "Failed to fetch goal history" }, { status: 500 });
  }
}