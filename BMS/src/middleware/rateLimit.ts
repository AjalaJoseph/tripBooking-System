import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
import { rateLimit } from "express-rate-limit"
import { RedisStore } from "rate-limit-redis";
export const authRateLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: async (...args: (string | number)[]): Promise<any> => {
            const command = args[0] as string;
            const commandArgs = args.slice(1);
            return redis.call(command, ...commandArgs);
        },
        prefix: 'rl-auth:',
    }),
    windowMs: 60 * 1000, // ⏱️ Timeframe boundary: 1 minute
    limit: 5,            // 🔒 Strict threshold: Max 5 login/signup attempts per minute
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req:Request, res:Response) => {
        return res.status(429).json({
            status: "fail",
            message: "Too many authentication attempts. Please wait 1 minute before trying again."
        });
    }
});