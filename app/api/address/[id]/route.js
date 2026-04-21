import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function DELETE(request, { params }) {
  try {
    const user = await currentUser();
    
    // If no user session is found, reject the request with a 401 Unauthorized status
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const address = await prisma.address.findUnique({
      // Search the 'address' table where the 'id' column matches the ID from the URL
      where: { id },
    });

    // Error Handling: If Prisma returns null, the address doesn't exist
    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Authorization Check 
    if (address.userId !== user.id) {
      // Return a 403 Forbidden status if they are trying to delete someone else's data
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If the address exists and the user owns it, proceed to delete it from the database
    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Address deleted successfully" });

  } catch (error) {
    
    console.error("Delete Address Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}