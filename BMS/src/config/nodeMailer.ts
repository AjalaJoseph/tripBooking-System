import dotenv from "dotenv";
import nodemailer, { Transporter } from "nodemailer";
import dns from "node:dns";

dotenv.config();

// Prefer IPv4 on environments where IPv6 outbound SMTP is unavailable
dns.setDefaultResultOrder("ipv4first");

const smtpUser = process.env.email_user || "";
const smtpPass = process.env.email_password || "";

export const transporter: Transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,

  auth: {
    user: smtpUser,
    pass: smtpPass,
  },

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
});