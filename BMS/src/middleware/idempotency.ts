import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis.js";

/**
 * Enterprise-grade Idempotency Key Gateway Middleware.
 * Decodes header parameters, replays cached success strings, and guarantees self-healing locks on errors.
 */
export const enforceIdempotencyKeyGate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawIdempotencyKey = req.headers['idempotency-key'];

    // 💡 If the client request lacks a tracking header, pass control safely down to normal routing stacks
    if (!rawIdempotencyKey) {
      return next();
    }

    const redisLockKey = `idempotency:${rawIdempotencyKey}`;
    const LOCK_TIME_SECONDS = 180; // 3-minute network recovery timeline frame

    // 🔒 STEP 1: ACQUIRE EXCLUSIVE PROCESSING MUTEX LOCK
    // NX: Set only if missing. EX: Self-destruct timer execution boundary.
    const acquiredLockResult = await redis.set(redisLockKey, 'PROCESSING',  'EX', LOCK_TIME_SECONDS);

    if (!acquiredLockResult) {
      const existingLockDataCache = await redis.get(redisLockKey);

      // A. CASE A: The transaction is still computing actively inside your PostgreSQL tables
      if (existingLockDataCache === 'PROCESSING') {
        res.status(409).json({
          status: "fail",
          code: "DUPLICATE_REQUEST_IN_FLIGHT",
          message: "Conflict Gate: This transaction is already being actively processed. Please wait for the current stream execution to complete."
        });
        return;
      }

      // B. CASE B: Transaction has already finished previously! Replay the exact cached payload response parameters
      if (existingLockDataCache) {
        const cachedResponseBundle = JSON.parse(existingLockDataCache);
        res.status(cachedResponseBundle.statusCode).json(cachedResponseBundle.body);
        return;
      }
    }

    // 🛡️ STEP 2: SELF-HEALING SYSTEM OVERLAY INTERCEPTOR
    // Tracks network events directly to clear deadlocks if a server error or premature disconnect occurs!
    let responseBodyCaptured: any = null;
    const originalExpressJsonMethod = res.json;

    // Capture the payload data array text parameters right as they pass out of the controller
    res.json = function (body) {
      responseBodyCaptured = body;
      return originalExpressJsonMethod.call(this, body);
    };

    // 🚀 STEP 3: BIND RECONCILIATION CODES ON VIEWPORT COMPLETION
    // Listens natively onto the outbound network socket close-out event parameters channel
    res.on('finish', async () => {
      // If the checkout loop concluded on a 200/201 success, cache it permanently for the remaining 3 minutes!
      if (res.statusCode === 200 || res.statusCode === 201) {
        await redis.set(
          redisLockKey, 
          JSON.stringify({ statusCode: res.statusCode, body: responseBodyCaptured }), 
          'EX', 
          LOCK_TIME_SECONDS
        );
      } else {
        // 🧼 ANTIMATTER LOCK WIPER: If the database threw an exception or rejected an invalid input parameter, 
        // clear the processing block instantly so they can immediately retry their checkout submission!
        await redis.del(redisLockKey);
      }
    });

    // Handle abrupt network dropouts / client connection cancellations safely
    res.on('close', async () => {
      const currentCacheState = await redis.get(redisLockKey);
      if (currentCacheState === 'PROCESSING') {
        await redis.del(redisLockKey); // Wipe deadlocks cleanly
      }
    });

    return next();

  } catch (error) {
    return next(error);
  }
};
