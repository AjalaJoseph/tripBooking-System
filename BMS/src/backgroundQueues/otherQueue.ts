import { redis} from "../config/redis";
import { Queue } from "bullmq";
export const otherQueue = new Queue('general-queue', {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,             // 🔄 Added: Automatically retry up to 3 times if it fails
    backoff: {
      type: 'exponential',
      delay: 5000,           // 🔄 Added: Wait 5s before first retry, then 10s, then 20s...
    },
    removeOnComplete: true,  // Automatically clean up memory upon success
    removeOnFail: false,     // Keep failed jobs for auditing logs
  },
});