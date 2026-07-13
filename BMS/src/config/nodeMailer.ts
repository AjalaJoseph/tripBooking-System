import dotenv from "dotenv";
import nodeMailer, { Transporter } from "nodemailer"; // 💡 Imported the Transporter Type definition

dotenv.config();

export const transporter: Transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.email_user,
    pass: process.env.email_password // 🔒 Ensure this is an "App Password", not your normal password!
  }
});
