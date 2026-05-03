import prisma from "@/lib/prisma"; 
import authSeller from "@/middlewares/authSeller"; 
import { getAuth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server"; 
import { sendNotification } from "@/lib/sendNotification"; 

// POST: Update Order Status OR Assign Rider
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const body = await request.json();

    // ✅ NEW: Handle Store Assigning a Rider
    if (body.action === 'ASSIGN_RIDER') {
        const { deliveryId, riderId } = body;
        
        // Ensure delivery belongs to this store
        const delivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
            include: { goal: { include: { product: true } } }
        });

        if (delivery?.goal?.product?.storeId !== storeId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Create assignment request
        await prisma.deliveryAssignment.create({
            data: { deliveryId, riderId, status: 'PENDING' }
        });

        const riderProfile = await prisma.riderProfile.findUnique({ where: { id: riderId }, include: { user: true }});
        
        // Notify Rider
        if (riderProfile?.user?.email) {
            await sendNotification({
                userId: riderProfile.userId,
                email: riderProfile.user.email,
                title: "New Delivery Request! 📦",
                message: `A store has requested you for a delivery. Please check your Rider Dashboard to accept.`,
                type: "SYSTEM_ALERT",
                notifyInApp: true,
                notifyEmail: true
            });
        }
        return NextResponse.json({ success: true, message: "Rider assigned" });
    }

    // Normal Status Update Logic
    const { orderId, status } = body;
    const orderToUpdate = await prisma.order.findFirst({ where: { id: orderId, storeId }, include: { user: true } });
    if (!orderToUpdate) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    await prisma.order.updateMany({ where: { id: orderId, storeId }, data: { status } });

    if (orderToUpdate?.user) {
        await sendNotification({
            userId: orderToUpdate.userId,
            email: orderToUpdate.user.email,
            title: "Order Status Updated 📦",
            message: `The status of your recent order has been updated to: ${status.toUpperCase()}.`,
            type: "DELIVERY_UPDATE", 
            notifyInApp: true,
            notifyEmail: true
        });
    }

    return NextResponse.json({ message: "Order status updated successfully" });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Get Unified Orders & Active Riders
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    // ✅ NEW: Fetch all approved riders so the store can pick one
    const availableRiders = await prisma.riderProfile.findMany({
        where: { status: 'APPROVED' },
        include: { user: true }
    });

    const standardOrders = await prisma.order.findMany({
      where: { storeId },
      include: { user: true, priceLocks: { include: { product: true } } },
    });

    const goalDeliveries = await prisma.delivery.findMany({
      where: { goal: { product: { storeId: storeId } } },
      include: {
        goal: { include: { user: true, product: true } },
        rider: { include: { user: true } },
        assignments: { orderBy: { createdAt: 'desc' }, take: 1 } // Check if a request is pending
      }
    });

    const unifiedOrders = [
        ...standardOrders.map(order => ({
            id: order.id, type: "STANDARD", 
            trackingNumber: `ORD-${order.id.substring(0, 6).toUpperCase()}`,
            customerName: order.user?.name || "Guest",
            productName: order.priceLocks?.[0]?.product?.name || "Standard Order Item",
            date: order.createdAt, status: order.status,
            address: order.shippingAddress || order.address || "No address provided",
            riderName: null, raw: order 
        })),
        ...goalDeliveries.map(delivery => {
            const latestAssignment = delivery.assignments?.[0];
            const isWaitingForRider = latestAssignment && latestAssignment.status === 'PENDING';
            
            return {
                id: delivery.id, type: "DELIVERY", 
                trackingNumber: delivery.trackingNumber,
                customerName: delivery.goal?.user?.name || "Unknown",
                productName: delivery.goal?.product?.name || "Unknown",
                date: delivery.createdAt, status: delivery.status,
                address: delivery.shippingAddress,
                riderName: delivery.rider?.user?.name || null,
                isWaitingForRider: isWaitingForRider, // ✅ Tell UI if store is waiting
                raw: delivery 
            }
        })
    ];

    unifiedOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

    const sanitizedOrders = JSON.parse(JSON.stringify(unifiedOrders, (key, value) => typeof value === 'bigint' ? value.toString() : value));
    const sanitizedRiders = JSON.parse(JSON.stringify(availableRiders, (key, value) => typeof value === 'bigint' ? value.toString() : value));

    return NextResponse.json({ orders: sanitizedOrders, riders: sanitizedRiders });

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}