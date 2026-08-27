import dotenv from "dotenv"
import { BrevoClient } from '@getbrevo/brevo';
import { logger } from "./logger";
dotenv.config()
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY || '',
});

interface SendEmailOptions {
  from?: { name: string; email: string };
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ from, to, subject, html }: SendEmailOptions): Promise<boolean> {
    try{
         const response = await brevo.transactionalEmails.sendTransacEmail({
      subject: subject,
      htmlContent: html,
      to: [{ email: to }],
      sender: {
        name: from?.name || "Baazio Admin",
        // Must match your verified Brevo Gmail address exactly!
        email: from?.email || process.env.email_user 
      }
    });
    return true
    }catch (error) {
    logger.error(error);
    throw error;
  }
}