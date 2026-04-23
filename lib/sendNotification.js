import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';
import { escapeHtml, sanitizeHtml } from '@/lib/security/sanitize';

// Configure the email sender
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendNotification = async ({ 
  userId, 
  email, 
  title, 
  message, 
  html, 
  type = "SYSTEM_ALERT", 
  goalId = null, 
  deliveryId = null,
  notifyInApp = true,    
  notifyEmail = true     
}) => {
  try {
    const safeTitle = String(title || '').trim().slice(0, 200);
    const safeMessage = String(message || '').trim().slice(0, 5000);
    const safeHtml = html ? sanitizeHtml(html) : `<p>${escapeHtml(safeMessage)}</p>`;

    // 1. Save to Database (In-App Alert)
    if (userId && notifyInApp) {
      await prisma.notification.create({
        data: {
          userId,
          goalId,
          deliveryId,
          title: safeTitle,
          message: safeMessage,
          type,
          channel: "IN_APP", 
        }
      });
    }

    // 2. Send Email via Gmail
    if (email && notifyEmail) {
      await transporter.sendMail({
        from: `"DreamSaver" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: safeTitle,
        html: safeHtml, 
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Notification Engine Error:", error);
    return { success: false, error: error.message };
  }
};
