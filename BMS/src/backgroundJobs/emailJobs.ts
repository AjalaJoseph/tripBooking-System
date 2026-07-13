import { transporter } from "../config/nodeMailer";
import dotenv from "dotenv"
import { staffWelcomeEmailContent } from "../mails/sendWelcomeEmailToStaff";
import { generateStaffUpdateProfile } from "../mails/updateProfileMail";
import { passwordResetOtpEmailContent } from "../mails/resetPassword";
dotenv.config()
export const sendStaffWelcomeEmail = async (data:any)=>{
    // console.log("email job",data)
    await transporter.sendMail({
         from: '"BizFlow No-Reply" <noreply@BizFlow.System>', 
        to: data.staff_email,
        subject: '🚀 Welcome to the Team - Your BizFlow Workstation Access Credentials',
        text: `Hello ${data.staff_name}, your BizFlow login Email is: ${data.staff_email} and temporary password is: ${data.password}.`,
        html: staffWelcomeEmailContent(data)
    })
}

//  update profile email
export const sendStaffUpdateEmail = async (data:any) =>{
    await transporter.sendMail({
    from: '"BizFlow Security" <noreply@BizFlow.System>',
    to: data.staff_email,
    subject: '⚠️ Security Alert: BizFlow Workstation Profile Updated',
    text: `Hello ${data.staff_name}, your BizFlow profile parameters have been modified by ${data.owner_name}.`,
    html:  generateStaffUpdateProfile(data)
  });
}

//  reset password mail
export const forgotPasswordOtpEmail = async (email:string, name:string, otp_code:string) =>{
    await transporter.sendMail({
    from: '"BizFlow Security" <noreply@BizFlow.System>',
    to: email,
    subject: '🔒 Reset Your BizFlow Account Password',
    text: `Hello ${name}, use this verification code to reset your BizFlow password: ${otp_code}. This code expires in 5 minutes.`,
    html:  passwordResetOtpEmailContent(name, otp_code)
  });
}
