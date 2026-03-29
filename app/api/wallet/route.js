import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch the user's wallet and their transactions, ordered by newest first
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // If they don't have a wallet yet, return a blank slate
    if (!wallet) {
      return NextResponse.json({ 
        balance: 0, 
        transactions: [] 
      });
    }

    return NextResponse.json({
      balance: wallet.balance,
      transactions: wallet.transactions
    });

  } catch (error) {
    console.error("Fetch Wallet Error:", error);
    return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 });
  }
}