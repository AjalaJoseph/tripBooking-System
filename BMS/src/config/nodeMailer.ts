import dotenv from "dotenv";
import nodeMailer, { Transporter } from "nodemailer";
import dns from "dns"; 

dotenv.config();

// Define a structured configuration object with strict typing
const mailOptions = {
  service: "gmail",
  auth: {
    user: process.env.email_user,
    pass: process.env.email_password 
  },
  // Explicitly type the parameters to pass "noImplicitAny" rules
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

// Pass the configuration explicitly into the transporter instantiation
export const transporter: Transporter = nodeMailer.createTransport(mailOptions as any);
