import prisma from "@/lib/prisma"; 
import authAdmin from "@/middlewares/authAdmin"; 
import { getAuth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server"; 
import { sendNotification } from "@/lib/sendNotification"; // ✅ IMPORT ENGINE

// ================================
// POST: Approve or Reject a Store
// ================================
export async function POST(request) {
  try {
    // Get authenticated user ID
    const { userId } = getAuth(request);

    // Check if user is an admin
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "not-authorized" }, { status: 401 });
    }

    // Parse storeId and status ('approved' or 'rejected') from request body
    const { storeId, status } = await request.json();

    //  Execute transactional update to ensure consistency
    await prisma.$transaction(async (tx) => {
        // ---- Update the store's status and active flag ----
        const storeUpdateData = {
            status: status, // store status = 'approved' or 'rejected'
            isActive: status === "approved" // Only active if approved
        };
        await tx.store.update({
            where: { id: storeId },
            data: storeUpdateData
        });

        // ---- Update the associated store application ----
        const appStatus = status === "approved" ? "APPROVED" : "REJECTED";
        
        // Use updateMany in case there are multiple applications for the same store (edge case)
        await tx.storeApplication.updateMany({
            where: { storeId: storeId },
            data: { 
                status: appStatus,
                reviewedBy: userId, // Track which admin reviewed it
                reviewedAt: new Date() // Timestamp of review
            }
        });
    });

    // ✅ FIRE ENGINE: Notify the Store Owner
    const storeInfo = await prisma.store.findUnique({
      where: { id: storeId },
      include: { user: true }
    });

    if (storeInfo && storeInfo.user) {
      const isApproved = status === "approved";
      
      // Build a dynamic HTML template right here for the store update
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: ${isApproved ? '#16a34a' : '#dc2626'}; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">
            Store Application ${isApproved ? 'Approved! 🎉' : 'Update'}
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

      await sendNotification({
        userId: storeInfo.userId,
        email: storeInfo.user.email,
        title: isApproved ? "Your Store is Approved! 🎉" : "Store Application Update",
        message: `Your store application for ${storeInfo.name} has been ${status}.`,
        html: emailHtml,
        type: "SYSTEM_ALERT",
        notifyInApp: true,
        notifyEmail: true
      });
    }

    //  Return success message
    return NextResponse.json({ message: `Store ${status} successfully` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

// ==========================================
// GET: Fetch all pending or rejected stores
// ==========================================
export async function GET(request) {
  try {
    // 1️⃣ Get authenticated user ID
    const { userId } = getAuth(request);

    // 2️⃣ Ensure user is an admin
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // 3️⃣ Fetch stores with status 'pending' or 'rejected'
    // Include user and storeApplication data for admin panel display
    const stores = await prisma.store.findMany({
      where: { status: { in: ["pending", "rejected"] } },
      include: { 
          user: true, // Include user info (name, email)
          storeApplication: true // Include application info (CNIC, bank, etc.)
      },
    });

    // 4️⃣ Return stores data
    return NextResponse.json({ stores });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}