import Redis from "ioredis";
import dotenv from 'dotenv'
dotenv.config()
const redisPort = process.env.redis_port? parseInt(process.env.redis_port) :6379
export const redis = new Redis({ 
      host:process.env.redis_host,
      port:redisPort,
      maxRetriesPerRequest: null,
})
redis.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🚀 Ultra-fast Redis Cache engine connected successfully.');
  }
});