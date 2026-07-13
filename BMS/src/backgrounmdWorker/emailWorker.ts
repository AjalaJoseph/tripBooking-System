import { Worker ,Job} from "bullmq";
import { redis } from "../config/redis";
import { sendStaffWelcomeEmail, sendStaffUpdateEmail, forgotPasswordOtpEmail } from "../backgroundJobs/emailJobs";
export const staffOnboardingWorker = new Worker('staff-onboarding', async (job:Job) =>{
    //  console.log("📥 [Worker Picked Up Job]:", job.data);
     try {
        const currentAttempt = job.attemptsMade + 1;
    
    if (job.name === 'send-welcome-email') {
      console.log(`🔨 [BizFlow Queue]: Processing onboarding job [${job.id}] (Attempt #${currentAttempt})`);
        const formattedJobData = {
        staff_email: job.data.staff_email, // Fallback check for both variations
        staff_name:  job.data.staff_name , 
        password:    job.data.password,
        owner_name:   job.data.owner_name
      };
    //   console.log("formated data", formattedJobData)
        await sendStaffWelcomeEmail(formattedJobData)
    }
    
   if (job.name === 'send-profile-update') {
      console.log(`🛡️ [BizFlow Queue]: Processing security update job [${job.id}] (Attempt #${currentAttempt})`);
      const updateFormatData ={
        staff_email: job.data.staff_email, // Fallback check for both variations
        staff_name:  job.data.staff_name , 
        role: job.data.role,
        owner_name:   job.data.owner_name
      }

      await sendStaffUpdateEmail(updateFormatData)
   }

//     reset password worker
   if (job.name === "forgot-password-otp") {
         console.log(`🔨 [BizFlow Queue]: Processing password reset OTP job [${job.id}]`);
        const { email, userName, otpcode } = job.data;

        // Execute your secure NodeMailer SMTP delivery pipeline cleanly
        await forgotPasswordOtpEmail(email, userName, otpcode);
}
    }catch(error){
        console.log(`❌ send welcome email  method threw an internal error inside job [${job.id}]: ${error}`)
           throw error; 
    }
} ,
{
    connection:redis as any,
    concurrency:10
}
);
staffOnboardingWorker.on('completed', (job: Job) => {
    console.log(`🎉 Onboarding job [${job.id}] completely processed and memory slots wiped from Redis RAM.`);
});

staffOnboardingWorker.on('failed', (job: Job | undefined, err: Error) => {
    console.log(`❌ Background Onboarding Job [${job?.id || 'unknown'}] processing failure: ${err.message}`);
});