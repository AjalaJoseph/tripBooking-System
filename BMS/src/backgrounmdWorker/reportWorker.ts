import { reportJob, cvsReportJob } from "../backgroundJobs/reportPdfJob.js";
import { Worker, Job } from "bullmq";
import { redis } from "../config/redis.js";

export const reportWorker = new Worker("general-queue", async (job: Job) => {
  try {
    const currentAttempt = job.attemptsMade + 1;
        
    if (job.name === 'compile-pdf-report-statement') {
      console.log(`🔨 [BizFlow Queue]: Processing generate report job [${job.id}] (Attempt #${currentAttempt})`);
      
      // 💡 THE ULTIMATE FIX: Pull parameters out of job.data instead of job root!
      const { businessId, startDateQuery, jobId } = job.data;

      const formattedJobData = {
        business_id: businessId,      // Maps perfectly to what reportJob expects
        startDate:   startDateQuery,
        jobId:       jobId
      };

      // Execute your high-speed consolidated Times-Roman PDF draw script pipeline
      await reportJob(formattedJobData);
    }
    //  cvs report download worker
     if (job.name === 'compile-cvs-report-statement') {
      console.log(`🔨 [BizFlow Queue]: Processing generate report job [${job.id}] (Attempt #${currentAttempt})`);
      
      // 💡 THE ULTIMATE FIX: Pull parameters out of job.data instead of job root!
      const { businessId, startDateQuery, jobId } = job.data;

      const formattedJobData = {
        business_id: businessId,      // Maps perfectly to what reportJob expects
        startDate:   startDateQuery,
        jobId:       jobId
      };

      // Execute your high-speed consolidated Times-Roman PDF draw script pipeline
      await cvsReportJob(formattedJobData);
    }
  } catch (error) {
    console.log(`❌ Error when generating report threw an internal error inside job [${job.id}]: ${error}`);
    throw error; // Re-throw so BullMQ knows to try again based on your automatic backoff retry logic!
  }
},
{
  connection: redis as any,
  concurrency: 10 // 🚀 Elite: Multi-threaded background architecture! Processes 10 PDFs concurrently.
});

// Sync your completion tracking listeners to match your reporting domain nomenclature
reportWorker.on('completed', (job: Job) => {
  console.log(`🎉 Financial Statement Job [${job.id}] completely processed and saved to server memory slots.`);
});

reportWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.log(`❌ Background Reporting Job [${job?.id || 'unknown'}] processing failure: ${err.message}`);
});
