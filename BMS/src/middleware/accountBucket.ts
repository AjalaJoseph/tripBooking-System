import { redis } from "../config/redis.js";
const ACCOUNT_BUCKET_PREFIX = "account-login";
const FAILURE_WINDOW_SECONDS = 15 * 60; // 15 minutes
const MAX_FAILURES = 5;
export const accountBucketService = {
  async recordFailure(accountId: string) {
    const key = `${ACCOUNT_BUCKET_PREFIX}:${accountId}`;
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      await redis.expire(key, FAILURE_WINDOW_SECONDS);
    }
    return {
      attempts,
      blocked: attempts >= MAX_FAILURES,
    };
  },

  async getFailureCount(accountId: string) {
    const key = `${ACCOUNT_BUCKET_PREFIX}:${accountId}`;
    const attempts = await redis.get(key);
    return Number(attempts || 0);
  },


  async isBlocked(accountId: string) {
  const key = `${ACCOUNT_BUCKET_PREFIX}:${accountId}`;

  const attempts = await this.getFailureCount(accountId);
  const retryAfter = await redis.ttl(key);

  return {
    blocked: attempts >= MAX_FAILURES,
    attempts,
    retryAfter: retryAfter > 0 ? retryAfter : 0,
  };
},

  async clear(accountId: string) {
    const key = `${ACCOUNT_BUCKET_PREFIX}:${accountId}`;
    await redis.del(key);
  }
};