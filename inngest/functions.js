import { inngest } from "./client"
import prisma from "@/lib/prisma"

//  NEW IMPORTS FOR NOTIFICATIONS
import { sendNotification } from "@/lib/sendNotification"
import { depositReminderTemplate } from "@/lib/emailTemplates"

// Create user
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-create" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { data } = event
    if (!data?.id) return

    await prisma.user.create({
      data: {
        id: data.id,
        email: data.email_addresses[0]?.email_address || "",
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        image: data.image_url || "",
      },
    })
  }
)

// Update user
export const syncUserUpdation = inngest.createFunction(
  { id: "sync-user-update" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { data } = event
    if (!data?.id) return

    await prisma.user.update({
      where: { id: data.id },
      data: {
        email: data.email_addresses[0]?.email_address || "",
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        image: data.image_url || "",
      },
    })
  }
)

// Delete user
export const syncUserDeletion = inngest.createFunction(
  { id: "sync-user-delete" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { data } = event
    if (!data?.id) return

    await prisma.user.delete({
      where: { id: data.id },
    })
  }
)

// Delete expired coupon
export const deleteCouponOnExpiry = inngest.createFunction(
  { id: "delete-coupon-on-expiry" },
  { event: "app/coupon.expired" },
  async ({ event, step }) => {
    const { data } = event
    if (!data?.code || !data?.expires_at) return

    const expiryDate = new Date(data.expires_at)
    await step.sleepUntil("wait-for-expiry", expiryDate)

    await step.run("delete-coupon-from-database", async () => {
      await prisma.coupon.delete({
        where: { code: data.code },
      })
    })
  }
)

// ==========================================
//   DEPOSIT REMINDER CRON JOB
// ==========================================
export const weeklyDepositReminder = inngest.createFunction(
  { id: "weekly-deposit-reminder" },
  { cron: "0 9 * * 1" }, // Runs every Monday at 9:00 AM
  async ({ step }) => {
    
    const remindersSent = await step.run("find-and-email-neglected-goals", async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Find goals that haven't been deposited into in 7 days
      const neglectedGoals = await prisma.goal.findMany({
        where: {
          status: "ACTIVE",
          updatedAt: { lt: sevenDaysAgo }
        },
        include: { 
          product: true, 
          user: true 
        }
      });

      let emailsSentCount = 0;

      for (const goal of neglectedGoals) {
        if (goal.user?.email) {
          const remainingAmount = Number(goal.targetAmount) - Number(goal.saved);
          
          await sendNotification({
            userId: goal.userId,
            email: goal.user.email,
            title: "Keep your DreamSaver goal on track! ⏳",
            message: `You have Rs ${remainingAmount} left to save for ${goal.product?.name}.`,
            html: depositReminderTemplate(
              goal.user.name, 
              goal.product?.name || "your goal", 
              remainingAmount, 
              goal.endDate || new Date()
            ),
            type: "DEPOSIT_REMINDER",
            goalId: goal.id,
            notifyInApp: true,
            notifyEmail: true
          });
          
          emailsSentCount++;
        }
      }

      return emailsSentCount;
    });

    return { message: `Successfully sent ${remindersSent} weekly reminder emails.` };
  }
)