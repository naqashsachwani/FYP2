import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import authRider from '@/middlewares/authRider';
import imagekit from "@/configs/imageKit";
import { sendNotification } from "@/lib/sendNotification";

// GET: Fetch Specific Delivery Details for the Rider
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { userId } = getAuth(req);
    const riderId = await authRider(userId);
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const delivery = await prisma.delivery.findUnique({
      where: { id, currentRiderId: riderId },
      include: {
        goal: { include: { user: true, product: { include: { store: true } } } }
      }
    });

    if (!delivery) return NextResponse.json({ error: "Delivery not found" }, { status: 404 });

    const sanitized = JSON.parse(JSON.stringify(delivery, (key, value) => 
      (typeof value === 'bigint') ? value.toString() : value
    ));

    return NextResponse.json(sanitized);
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// POST: Handle Status Updates and Proof Upload
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { userId } = getAuth(req);
    const riderId = await authRider(userId);
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const formData = await req.formData();
    const action = formData.get("action"); // 'PICKUP', 'DELIVER', 'FAIL'
    
    const delivery = await prisma.delivery.findUnique({
      where: { id, currentRiderId: riderId },
      include: { goal: { include: { user: true, product: { include: { store: true } } } } }
    });

    if (!delivery) return NextResponse.json({ error: "Invalid Delivery" }, { status: 400 });

    // --- ACTION: VERIFY PICKUP ---
    if (action === 'PICKUP') {
      const updated = await prisma.delivery.update({
        where: { id },
        data: { status: 'IN_TRANSIT' } 
      });

      if (delivery.goal?.user?.email) {
          await sendNotification({
              userId: delivery.goal.userId,
              email: delivery.goal.user.email,
              title: "Order Picked Up! 🚚",
              message: `Your order for ${delivery.goal.product?.name} has been picked up by the rider and is currently IN TRANSIT to your location.`,
              type: "DELIVERY_UPDATE",
              deliveryId: id,
              goalId: delivery.goalId,
              notifyInApp: true,
              notifyEmail: true
          });
      }

      return NextResponse.json({ success: true, status: updated.status });
    }

    // --- ACTION: VERIFY DELIVERY & UPLOAD PROOF ---
    if (action === 'DELIVER') {
      const file = formData.get("proofImage");
      let proofImageUrl = null;

      // 1. Upload Optional Photo Proof
      if (file && file !== 'null') {
          const buffer = Buffer.from(await file.arrayBuffer());
          const uploadRes = await imagekit.upload({
            file: buffer,
            fileName: `proof-${id}.jpg`,
            folder: "/deliveries/proofs"
          });
          proofImageUrl = uploadRes.url;
      }

      // 2. Create Proof Record
      await prisma.proofOfDelivery.create({
        data: {
          deliveryId: id,
          riderId,
          proofImageUrl: proofImageUrl
        }
      });

      // 3. Payout Logic (Rs 400 for >= 5000, Rs 200 for < 5000)
      const itemPrice = parseFloat(delivery.goal?.targetAmount || delivery.goal?.product?.price || 0);
      const payoutAmount = itemPrice >= 5000 ? 400.0 : 200.0;
      
      const existingPayout = await prisma.riderPayout.findUnique({ 
          where: { deliveryId: id } 
      });

      if (!existingPayout) {
          // ✅ THE FIX: Create the payout strictly as 'PENDING'.
          // ❌ DELETED the prisma.riderProfile.update() that was instantly paying the rider.
          await prisma.riderPayout.create({
            data: { 
                riderId, 
                deliveryId: id, 
                amount: payoutAmount,
                status: 'PENDING' // Awaits admin approval in Escrow
            }
          });
      }

      // 4. Mark Delivery Complete
      const updated = await prisma.delivery.update({
        where: { id },
        data: { status: 'DELIVERED', deliveryDate: new Date() }
      });

      if (delivery.goal?.user?.email) {
          await sendNotification({
              userId: delivery.goal.userId,
              email: delivery.goal.user.email,
              title: "Order Delivered! 📦",
              message: `Your order for ${delivery.goal.product?.name} has been successfully delivered. Thank you for using DreamSaver!`,
              type: "DELIVERY_UPDATE",
              deliveryId: id,
              goalId: delivery.goalId,
              notifyInApp: true,
              notifyEmail: true
          });
      }

      if (delivery.goal?.product?.store?.email) {
          await sendNotification({
              userId: delivery.goal.product.store.userId,
              email: delivery.goal.product.store.email,
              title: "Delivery Completed! ✅",
              message: `Your product (${delivery.goal.product?.name}) has been successfully delivered to the customer.`,
              type: "DELIVERY_UPDATE",
              deliveryId: id,
              goalId: delivery.goalId,
              notifyInApp: true,
              notifyEmail: true
          });
      }

      return NextResponse.json({ success: true, status: updated.status });
    }

    // --- ACTION: FAIL DELIVERY ---
    if (action === 'FAIL') {
      const reason = formData.get("reason");
      await prisma.delivery.update({
        where: { id },
        data: { status: 'FAILED', failureReason: reason }
      });

      if (delivery.goal?.user?.email) {
          await sendNotification({
              userId: delivery.goal.userId,
              email: delivery.goal.user.email,
              title: "Delivery Attempt Failed ⚠️",
              message: `Our rider attempted to deliver your order for ${delivery.goal.product?.name} but encountered an issue: ${reason}. Support will contact you shortly.`,
              type: "DELIVERY_UPDATE",
              deliveryId: id,
              goalId: delivery.goalId,
              notifyInApp: true,
              notifyEmail: true
          });
      }

      return NextResponse.json({ success: true, status: 'FAILED' });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Action Error:", error);
    return NextResponse.json({ error: "Failed to process update" }, { status: 500 });
  }
}