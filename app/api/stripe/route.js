import prisma from "@/lib/prisma"; // Prisma client for database operations
import { NextResponse } from "next/server"; // Next.js response helper
import Stripe from "stripe"; // Stripe SDK

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ================== POST: Checkout & Webhook Handler ==================
export async function POST(request) {
  const url = new URL(request.url); // Parse request URL
  const mode = url.searchParams.get("mode"); // Determine mode: 'checkout' or webhook

  /* =====================================================
     CHECKOUT SESSION CREATION
  ===================================================== */
  if (mode === "checkout") {
    try {
      // ================== BASE URL DETECTION ==================
      const protocol = request.headers.get("x-forwarded-proto") || "https"; // Detect protocol
      const host = request.headers.get("host"); // Detect host
      const baseUrl = request.headers.get("origin") || `${protocol}://${host}`; // Robust base URL

      // Extract required data from request body
      const { goalIds, userId, amount } = await request.json();

      // Validate inputs
      if (!goalIds?.length || !userId || !amount) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 });
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        mode: "payment", // One-time payment
        payment_method_types: ["card"], // Accept card payments only
        line_items: [
          {
            price_data: {
              currency: "pkr", // Pakistani Rupees
              unit_amount: Math.round(Number(amount) * 100), // Stripe expects amount in smallest unit (paisa)
              product_data: { name: "Goal Deposit" }, // Name shown on Stripe checkout
            },
            quantity: 1,
          },
        ],
        metadata: {
          appId: "dreamsaver", // Custom metadata to identify this app
          goalIds: goalIds.join(","), // Store goal IDs as comma-separated string
          userId,
          amountPaid: amount,
        },
        // Redirect URLs after payment
        success_url: `${baseUrl}/cart`, // On success
        cancel_url: `${baseUrl}/goals?cancel=1`, // On cancel
      });

      // Return Stripe checkout URL to frontend
      return NextResponse.json({ checkoutUrl: session.url });
    } catch (err) {
      // Handle checkout creation errors
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  /* =====================================================
      STRIPE WEBHOOK HANDLING
  ===================================================== */
  try {
    const sig = request.headers.get("stripe-signature"); // Get signature header
    if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

    const body = await request.text(); // Get raw request body for webhook verification
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // Webhook secret to verify authenticity
    );

    // Handle completed checkout session
    if (event.type === "checkout.session.completed") {
      const session = event.data.object; // Stripe session object
      const { goalIds, userId, appId, amountPaid } = session.metadata;

      // Ignore webhook if it's not from our app
      if (appId !== "dreamsaver") return NextResponse.json({ received: true });

      const goalIdsArray = goalIds.split(","); // Convert string to array
      const amountPerGoal = Number(amountPaid) / goalIdsArray.length; // Split payment evenly among goals

      // ================== UPDATE DATABASE ==================
      await Promise.all(
        goalIdsArray.map(async (goalId) => {
          //  Create deposit record
          await prisma.deposit.create({
            data: {
              goalId,
              userId,
              amount: amountPerGoal,
              paymentMethod: "STRIPE_CHECKOUT",
              status: "COMPLETED",
              receiptNumber: session.id, // Stripe session ID as receipt
            },
          });

          // Fetch the goal
          const goal = await prisma.goal.findUnique({ where: { id: goalId } });
          if (!goal) return;

          // Aggregate total saved for the goal
          const totalSavedAgg = await prisma.deposit.aggregate({
             _sum: { amount: true },
             where: { goalId },
          });
          const newSavedTotal = totalSavedAgg._sum.amount || 0;

          //  Update goal status based on total saved
          const status = newSavedTotal >= Number(goal.targetAmount) ? "COMPLETED" : "ACTIVE";
          
          await prisma.goal.update({
            where: { id: goalId },
            data: { saved: newSavedTotal, status },
          });
        })
      );

      // Clear user's cart after payment
      await prisma.user.update({
        where: { id: userId },
        data: { cart: {} },
      });
    }

    // Respond to Stripe to acknowledge receipt of the webhook
    return NextResponse.json({ received: true });
  } catch (err) {
    // Log webhook errors
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// Disable default body parser for Stripe webhooks
export const config = {
  api: { bodyParser: false },
};
