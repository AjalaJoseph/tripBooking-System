import Redis from "ioredis";
import dotenv from 'dotenv'
import { logger } from "./logger";
dotenv.config()
const redisPort = process.env.redis_port? parseInt(process.env.redis_port) :6379
export const redis = new Redis({ 
      host:process.env.redis_host,
      port:redisPort,
      maxRetriesPerRequest: null,
})
redis.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('🚀 Redis Cache engine connected successfully.');
  }
});