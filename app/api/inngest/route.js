import { serve } from "inngest/next";               
import { inngest } from "@/inngest/client";        
import {
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  deleteCouponOnExpiry,
  weeklyDepositReminder // ✅ NEW: Import the reminder function
} from "@/inngest/functions";                      

export const { GET, POST, PUT } = serve({
  client: inngest,                                 
  functions: [
    syncUserCreation,     
    syncUserUpdation,     
    syncUserDeletion,     
    deleteCouponOnExpiry, 
    weeklyDepositReminder // ✅ NEW: Register the function
  ],
});