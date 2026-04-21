import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// ==========================================
// GET: Fetch and sort all coupons for the user
// ==========================================
export async function GET(req) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const now = new Date();

        // 1.  Fetch public coupons OR private coupons assigned to this user
        const allCoupons = await prisma.coupon.findMany({
            where: { 
                OR: [
                    { isPublic: true },
                    { userId: userId } // Grabs their apology coupons!
                ]
            },
            orderBy: { expiresAt: 'desc' }
        });

        // 2. See how many times this specific user has used each coupon
        const usageRecords = await prisma.couponUsage.groupBy({
            by: ['couponCode'],
            where: { userId },
            _count: { couponCode: true }
        });

        // Convert array to a quick lookup object
        const usageMap = {};
        usageRecords.forEach(record => {
            usageMap[record.couponCode] = record._count.couponCode;
        });

        // 3. Check if they are a "New User"
        const goalCount = await prisma.goal.count({ where: { userId } });
        const isNewUser = goalCount === 0;

        // 4. Sort into Valid vs Invalid/Expired
        const validCoupons = [];
        const invalidCoupons = [];

        allCoupons.forEach(coupon => {
            const timesUsed = usageMap[coupon.code] || 0;
            const isExpired = new Date(coupon.expiresAt) < now;
            const limitReached = timesUsed >= coupon.usageLimit;
            const failedNewUserCheck = coupon.forNewUser && !isNewUser;

            if (isExpired || limitReached || failedNewUserCheck) {
                let reason = "Expired";
                if (limitReached) reason = `Used ${timesUsed}/${coupon.usageLimit} times`;
                if (failedNewUserCheck) reason = "For new users only";

                invalidCoupons.push({ ...coupon, timesUsed, reason });
            } else {
                validCoupons.push({ ...coupon, timesUsed });
            }
        });

        return NextResponse.json({ validCoupons, invalidCoupons });

    } catch (error) {
        console.error("Fetch User Coupons Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// ==========================================
// POST: Validate a specific coupon code
// ==========================================
export async function POST(req) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { code } = await req.json();
        if (!code) return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });

        // 1. Find the coupon
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon) return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });

        //  SECURITY: Check if it's a private apology coupon assigned to someone else
        if (!coupon.isPublic && coupon.userId && coupon.userId !== userId) {
            return NextResponse.json({ error: "This coupon is not assigned to your account." }, { status: 403 });
        }

        // 2. Check Expiry
        if (new Date(coupon.expiresAt) < new Date()) {
            return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
        }

        // 3. Check Usage Limits
        const usageCount = await prisma.couponUsage.count({
            where: { userId, couponCode: coupon.code }
        });

        if (usageCount >= coupon.usageLimit) {
            return NextResponse.json({ error: `You have reached the usage limit (${coupon.usageLimit}) for this coupon.` }, { status: 400 });
        }

        // 4. Check New User Constraint
        if (coupon.forNewUser) {
            const previousGoals = await prisma.goal.count({ where: { userId } });
            if (previousGoals > 0) {
                return NextResponse.json({ error: "This coupon is strictly for new users." }, { status: 400 });
            }
        }

        // Valid! Return the discount details
        return NextResponse.json({ 
            success: true, 
            discount: coupon.discount,
            description: coupon.description
        });

    } catch (error) {
        console.error("Coupon Validation Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}