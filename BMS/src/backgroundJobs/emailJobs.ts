import { transporter } from "../config/nodeMailer";
import dotenv from "dotenv"
import resend from "../config/resend";
import { staffWelcomeEmailContent } from "../mails/sendWelcomeEmailToStaff";
import { generateStaffUpdateProfile } from "../mails/updateProfileMail";
import { passwordResetOtpEmailContent } from "../mails/resetPassword";
dotenv.config()
export const sendStaffWelcomeEmail = async (data:any)=>{
    // console.log("email job",data)
    await resend.emails.send({
      from:'"Baazio No-Reply" <noreply@Baazio.System>',
      to:data.staff_email,
      subject:'🚀 Welcome to the Team - Your Baazio Workstation Access Credentials',
      html:staffWelcomeEmailContent(data)
    })
    // await transporter.sendMail({
    //      from: '"Baazio No-Reply" <noreply@Baazio.System>', 
    //     to: data.staff_email,
    //     subject: '🚀 Welcome to the Team - Your Baazio Workstation Access Credentials',
    //     text: `Hello ${data.staff_name}, your Baazio login Email is: ${data.staff_email} and temporary password is: ${data.password}.`,
    //     html: staffWelcomeEmailContent(data)
    // })
}

//  update profile email
export const sendStaffUpdateEmail = async (data:any) =>{
    await transporter.sendMail({
    from: '"Baazio Security" <noreply@Baazio.System>',
    to: data.staff_email,
    subject: '⚠️ Security Alert: Baazio Workstation Profile Updated',
    text: `Hello ${data.staff_name}, your Baazio profile parameters have been modified by ${data.owner_name}.`,
    html:  generateStaffUpdateProfile(data)
  });
}

//  reset password mail
export const forgotPasswordOtpEmail = async (email:string, name:string, otp_code:string) =>{
    await transporter.sendMail({
    from: '"Baazio Security" <noreply@Baazio.System>',
    to: email,
    subject: '🔒 Reset Your Baazio Account Password',
    text: `Hello ${name}, use this verification code to reset your Baazio password: ${otp_code}. This code expires in 5 minutes.`,
    html:  passwordResetOtpEmailContent(name, otp_code)
  });
}
