import { reportJob, cvsReportJob } from "../backgroundJobs/reportPdfJob";
import { Worker, Job } from "bullmq";
import { redis } from "../config/redis";
import { logger } from "../config/logger";
export const reportWorker = new Worker("general-queue", async (job: Job) => {
  try {
    const currentAttempt = job.attemptsMade + 1;
        
    if (job.name === 'compile-pdf-report-statement') {
      logger.info(`🔨 [BizFlow Queue]: Processing generate report job [${job.id}] (Attempt #${currentAttempt})`);
      
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
      logger.info(`🔨 [BizFlow Queue]: Processing generate report job [${job.id}] (Attempt #${currentAttempt})`);
      
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
    logger.error(`❌ Error when generating report threw an internal error inside job [${job.id}]: ${error}`);
    throw error; // Re-throw so BullMQ knows to try again based on your automatic backoff retry logic!
  }
},
{
  connection: redis as any,
  concurrency: 10 // 🚀 Elite: Multi-threaded background architecture! Processes 10 PDFs concurrently.
});

// Sync your completion tracking listeners to match your reporting domain nomenclature
reportWorker.on('completed', (job: Job) => {
  logger.info(`🎉 Financial Statement Job [${job.id}] completely processed and saved to server memory slots.`);
});

reportWorker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error(`❌ Background Reporting Job [${job?.id || 'unknown'}] processing failure: ${err.message}`);
});
