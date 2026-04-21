import prisma from "@/lib/prisma"; 
import authAdmin from "@/middlewares/authAdmin"; 
import { getAuth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server"; 
import { sendNotification } from "@/lib/sendNotification"; 

// POST: Approve or Reject a Store
export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    // Authorization (Role-Based Access Control)
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "not-authorized" }, { status: 401 });
    }

    const { storeId, status } = await request.json();

    // Database Transaction
    await prisma.$transaction(async (tx) => {
        const storeUpdateData = {
            status: status, 
            isActive: status === "approved" 
        };
        
        // Update the main Store record
        await tx.store.update({
            where: { id: storeId },
            data: storeUpdateData
        });

        // Map the lowercase status to the uppercase ENUM required by the StoreApplication table
        const appStatus = status === "approved" ? "APPROVED" : "REJECTED";
        
        // Use updateMany in case there are multiple applications for the same store (edge case prevention)
        await tx.storeApplication.updateMany({
            where: { storeId: storeId },
            data: { 
                status: appStatus,
                reviewedBy: userId, 
                reviewedAt: new Date() 
            }
        });
    });

    // Notification System
    // Fetch the store's details and include the associated user object to get their email and name
    const storeInfo = await prisma.store.findUnique({
      where: { id: storeId },
      include: { user: true }
    });

    // If the store and user exist, proceed to send the notification
    if (storeInfo && storeInfo.user) {
      const isApproved = status === "approved";
      
      // Build a dynamic HTML email template based on the approval status
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: ${isApproved ? '#16a34a' : '#dc2626'}; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">
            Store Application ${isApproved ? 'Approved!' : 'Update'}
          </h2>
          <p>Hi ${storeInfo.user.name},</p>
          <p>We have reviewed your application for <strong>${storeInfo.name}</strong>.</p>
          <p style="padding: 15px; background-color: #f8fafc; border-left: 4px solid ${isApproved ? '#16a34a' : '#dc2626'};">
            Status: <strong>${status.toUpperCase()}</strong>
          </p>
          ${isApproved 
            ? '<p>Congratulations! You can now access your vendor dashboard and start adding products.</p>' 
            : '<p>Unfortunately, your application was not approved at this time. Please contact support if you have any questions.</p>'}
          <br/>
          <p>Best regards,<br/>The DreamSaver Team</p>
        </div>
      `;

      // Trigger the custom notification engine to send both an in-app alert and the HTML email
      await sendNotification({
        userId: storeInfo.userId,
        email: storeInfo.user.email,
        title: isApproved ? "Your Store is Approved!" : "Store Application Update",
        message: `Your store application for ${storeInfo.name} has been ${status}.`,
        html: emailHtml,
        type: "SYSTEM_ALERT",
        notifyInApp: true,
        notifyEmail: true
      });
    }

    // Success Response
    // Return a success message back to the frontend dashboard
    return NextResponse.json({ message: `Store ${status} successfully` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}


// GET: Fetch all pending or rejected stores
export async function GET(request) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = getAuth(request);

    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // Fetch stores with status 'pending' or 'rejected'
    const stores = await prisma.store.findMany({
      where: { status: { in: ["pending", "rejected"] } },
      include: { 
          user: true, 
          storeApplication: true 
      },
    });

    // Return the fetched array of stores
    return NextResponse.json({ stores });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}