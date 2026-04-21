// lib/emailTemplates.js

// Shared styles for a consistent, professional look
const baseStyle = "font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;";
const headerStyle = "color: #16a34a; font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;";
const highlightBox = "background-color: #f8fafc; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0; border-radius: 0 8px 8px 0;";

// 1. Goal Started (Matches enum: GOAL_START)
export const goalStartedTemplate = (userName, productName, targetAmount) => `
  <div style="${baseStyle}">
    <h2 style="${headerStyle}">Welcome to your new goal! </h2>
    <p>Hi ${userName},</p>
    <p>You have successfully started saving for <strong>${productName}</strong>.</p>
    <div style="${highlightBox}">
      <p style="margin: 0;"><strong>Target Amount:</strong> Rs ${Number(targetAmount).toLocaleString()}</p>
    </div>
    <p>We will keep your funds secure in escrow until you reach your goal. Every deposit brings you one step closer!</p>
    <br/>
    <p>Happy saving,<br/>The DreamSaver Team</p>
  </div>
`;

// 2. Deposit Confirmation (Matches enum: DEPOSIT_CONFIRMATION)
export const depositConfirmationTemplate = (userName, amount, productName, newTotal, target) => `
  <div style="${baseStyle}">
    <h2 style="${headerStyle}">Payment Received! </h2>
    <p>Hi ${userName},</p>
    <p>We successfully received your deposit of <strong>Rs ${Number(amount).toLocaleString()}</strong> towards your goal for <strong>${productName}</strong>.</p>
    <div style="${highlightBox}">
      <p style="margin: 0; font-size: 16px;"><strong>Progress:</strong> Rs ${Number(newTotal).toLocaleString()} / Rs ${Number(target).toLocaleString()}</p>
    </div>
    <p>Keep up the great work! You are getting closer to your dream purchase.</p>
    <br/>
    <p>Best regards,<br/>The DreamSaver Team</p>
  </div>
`;

// 3. Weekly Reminder (Matches enum: DEPOSIT_REMINDER)
export const depositReminderTemplate = (userName, productName, remainingAmount, dueDate) => `
  <div style="${baseStyle}">
    <h2 style="${headerStyle}">Keep your DreamSaver goal on track! </h2>
    <p>Hi ${userName},</p>
    <p>We noticed you haven't made a deposit towards <strong>${productName}</strong> recently.</p>
    <div style="${highlightBox}">
      <p style="margin: 0 0 10px 0;"><strong>Remaining to save:</strong> Rs ${Number(remainingAmount).toLocaleString()}</p>
      <p style="margin: 0; color: #dc2626;"><strong>Target Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
    </div>
    <p>Log in to your dashboard to make a quick deposit and stay on schedule.</p>
    <br/>
    <p>You've got this!<br/>The DreamSaver Team</p>
  </div>
`;