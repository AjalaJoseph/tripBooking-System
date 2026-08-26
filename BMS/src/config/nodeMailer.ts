import dotenv from "dotenv";
import nodeMailer, { Transporter } from "nodemailer";
import dns from "dns"; // 💡 Import Node's native DNS module

dotenv.config();

export const transporter: Transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.email_user,
    pass: process.env.email_password 
  },
  // 🚀 CRITICAL FIX: Forces Nodemailer to use IPv4 instead of Render's broken IPv6 routing
  dnsLookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, (err, address, family) => {
      callback(err, address, family);
    });
  }
});
