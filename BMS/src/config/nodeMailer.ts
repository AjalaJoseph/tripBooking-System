import dotenv from "dotenv";
import nodeMailer, { Transporter } from "nodemailer";
import dns from "dns";

dotenv.config();

const smtpUser = process.env.email_user || "";
const smtpPass = process.env.email_password || "";

const mailOptions = {
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

  dnsLookup: (
    hostname: string,
    options: dns.LookupOptions,
    callback: (
      err: NodeJS.ErrnoException | null,
      address: string,
      family: number
    ) => void
  ) => {
    dns.lookup(
      hostname,
      { family: 4 },
      (err, address, family) => {
        callback(err, address, family);
      }
    );
  },
};

export const transporter: Transporter =
  nodeMailer.createTransport(mailOptions as any);