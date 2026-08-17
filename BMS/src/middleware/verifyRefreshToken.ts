import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { redis } from "../config/redis";
import { hashRefreshToken } from "../ultil/hashToken";
import { revokeRefreshTokenFamily } from "../ultil/revokedUserSession";
dotenv.config();

export const verifyRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    const refreshKey = process.env.REFRESH_SECRET;
      if (!refreshKey) {
          throw new Error("REFRESH_SECRET is not configured");
        }
    if (!refreshToken) {
      return res.status(401).json({ 
        status: "fail", 
        message: "Authentication Failure: Refresh token token cookie is missing." 
      });
    }
    const decoded = jwt.verify(refreshToken, refreshKey) as {
      id: string;
      email: string;
      role: string;
      jti: string;
      familyId:string;
      exp: number;
    };
    if (!decoded.jti || decoded.familyId) {
      return res.status(403).json({
        status: "fail",
        message: "Invalid refresh token session.",
      });
    }
    console.log("JTI:", decoded.jti);
    console.log("FAMILY ID:", decoded.familyId);

    console.log(
      "Refresh exists:",
      await redis.exists(`refresh:${decoded.jti}`)
    );

    console.log(
      "Token revoked:",
      await redis.exists(`revoked-refresh:${decoded.jti}`)
    );

    console.log(
      "Family revoked:",
      await redis.exists(`revoked-family:${decoded.familyId}`)
    );
    const familyRevoked = await redis.exists(`revoked-family:${decoded.familyId}`);

    if (familyRevoked) {
      return res.status(403).json({
        status: "fail",
        code: "REFRESH_FAMILY_REVOKED",
        message:"This session has been revoked. Please sign in again.",
      });
    }

    const redisKey = `refresh:${decoded.jti}`;
    const cachedToken = await redis.get(redisKey);

    if (!cachedToken) {
       const revokedToken = await redis.get(`revoked-refresh:${decoded.jti}`);
          if (revokedToken) {
            const revokedSession = JSON.parse(revokedToken);
            const { userId, familyId, reason } = revokedSession;

            // Make sure the revoked record belongs to this user
            if (userId !== decoded.id || !familyId) {
              return res.status(403).json({
                status: "fail",
                code: "INVALID_REFRESH_TOKEN",
                message: "Invalid refresh token session.",
              });
            }
            console.warn(`Refresh token reuse detected for user ${decoded.id}, family ${familyId}` );
            await revokeRefreshTokenFamily(familyId);
            // 🚨 REFRESH TOKEN REUSE DETECTED
            return res.status(403).json({
              status: "fail",
              code: "REFRESH_TOKEN_REUSE_DETECTED",
              message: "Refresh token reuse detected. Please sign in again.",
            });
          }

      return res.status(403).json({
        status: "fail",
        message:"Access denied. This refresh token has already been revoked or is invalid.",
      });
    }

    
    const session = JSON.parse(cachedToken);
    const incomingHash = hashRefreshToken(refreshToken);
    if (session.refresh !== incomingHash) {
      return res.status(403).json({
        status: "fail",
        message: "Invalid refresh token session.",
      });
    }

    if (session.userId !== decoded.id) {
        return res.status(403).json({
          status: "fail",
          message: "Invalid refresh token session.",
        });
    }
   
     (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti,
      familyId:decoded.familyId,
      exp: decoded.exp,
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
