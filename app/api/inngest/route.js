import { serve } from "inngest/next";              // Inngest helper for Next.js API routes
import { inngest } from "@/inngest/client";        // Your configured Inngest client
import {
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  deleteCouponOnExpiry,
} from "@/inngest/functions";                     // Your event functions


export const { GET, POST, PUT } = serve({
  client: inngest,                                // Inngest client to handle incoming events
  functions: [
    syncUserCreation,     // Triggered when a new user is created
    syncUserUpdation,     // Triggered when a user is updated
    syncUserDeletion,     // Triggered when a user is deleted
    deleteCouponOnExpiry, // Triggered when a coupon expires
  ],
});
