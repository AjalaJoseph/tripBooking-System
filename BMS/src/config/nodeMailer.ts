import dotenv from "dotenv";
import nodeMailer, { Transporter } from "nodemailer";
import dns from "dns"; 

dotenv.config();
const smtpUser =process.env.email_user || "";
const smtpPass = process.env.email_password || "";
const mailOptions = {
  // 1. Drop the generic "service" string and target Google directly
  host: "://gmail.com",
  port: 587, // Try 587 first; if it times out, switch this number to 465
  secure: false, // Must be false for port 587, true for port 465
  
  auth: {
    user: smtpUser,
    pass: smtpPass 
  },
  
  // 2. Increase connection timeouts so Render has time to process the proxy handshake
  connectionTimeout: 20000, // 20 seconds
  greetingTimeout: 20000,
  socketTimeout: 30000,

  dnsLookup: (
    hostname: string, 
    options: dns.LookupOptions, 
    callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
  ) => {
    dns.lookup(hostname, { family: 4 }, (err, address, family) => {
      callback(err, address, family);
    });
  }
};

export const transporter: Transporter = nodeMailer.createTransport(mailOptions as any);
