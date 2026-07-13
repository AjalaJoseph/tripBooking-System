import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { redis } from "../config/redis";

dotenv.config();

/**
 * Validates the long-lived refresh token cookie against your fast Redis memory cluster.
 * Strictly adheres to Express middleware and Promise<void> execution constraints.
 */
export const verifyRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    // 💡 Typing Check: Ensured environment key alignment (REFRESH_SECRET)
    const refreshKey = process.env.REFRESH_SECRET || " ";

    if (!refreshToken) {
      return res.status(401).json({ 
        status: "fail", 
        message: "Authentication Failure: Refresh token token cookie is missing." 
      });
    }

    // 1. 🛡️ SAFE SYNC DECODE WITH INTERFACE TYPE CASTING
    // This interface allows the compiler to recognize your custom claims alongside native JWT properties
    const decoded = jwt.verify(refreshToken, refreshKey) as {
      id: string;
      email: string;
      role: string;
      exp: number;
    };

    const { id } = decoded;

    // 2. 🔍 CROSS-REFERENCE AGAINST YOUR REDIS RAM INSTANCE CONNECTION MATCH
    const cachedRedisToken = await redis.get(`refresh:${id}`);
    
    if (!cachedRedisToken || refreshToken !== cachedRedisToken) {
      return res.status(403).json({ 
        status: "fail", 
        message: "Access Denied: Invalid or expired session instance. Please re-authenticate." 
      });
    }

    // 3. 🚀 SESSION INJECTION PASS-THROUGH
    // Safely pipe the entire decoded token payload down to downstream session targets
    (req as any).user = {
      id:         decoded.id,
      email:      decoded.email,
      role:       decoded.role,
      exp:        decoded.exp
    };

    return next();

  } catch (error) {
    // 🔒 If the token is mathematically expired or altered, catch it here instead of crashing the server!
    return res.status(401).json({
      status: "fail",
      message: "Authentication Failure: Your refresh token has expired or is invalid. Session terminated."
    });
  }
};
