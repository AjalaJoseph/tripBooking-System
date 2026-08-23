import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { redis } from "../config/redis";
import { hashRefreshToken } from "../ultil/hashToken";
import { revokeRefreshTokenFamily } from "../ultil/revokedUserSession";
import { tokenRotationCounter } from "../monitoring/metrics";
import { createAuditLog } from "../models/log";
import { match } from "node:assert";
dotenv.config();

export const verifyRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    const refreshKey = process.env.REFRESH_SECRET;
      if (!refreshKey) {
          throw new Error("REFRESH_SECRET is not configured");
        }
    if (!refreshToken) {
      tokenRotationCounter.inc({ status: "failed", breach_detected: "false" });
      return res.status(401).json({ 
        status: "fail", 
        message: "Authentication Failure: Refresh token  cookie is missing." 
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

    if (!decoded.jti || !decoded.familyId) {
      return res.status(403).json({
        status: "fail",
        message: "Invalid refresh token session.",
      });
    }
   
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
            await revokeRefreshTokenFamily(familyId, "REFRESH_TOKEN_REUSE");
            tokenRotationCounter.inc({ status: "revoked_reuse", breach_detected: "true" });
             await createAuditLog({
                event: "REFRESH_TOKEN_REUSE_DETECTED",
                userId: decoded.id,
                ipAddress: req.ip,
                userAgent: req.get("user-agent") ?? undefined,
                metadata: {
                  jti: decoded.jti,
                  familyId:familyId,
                  reason: reason ?? "REVOKED_REFRESH_TOKEN_REUSED",
                },
            });
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



// revokeallusersession and token when user update is password
export const revokeAllUserTokenSessions = async (userId:string) =>{
  let cursor = "0"
    const families = new Set<string>();
  do{
     const [nextCursor, keys] = await redis.scan(
      cursor,
      "MATCH",
      "refresh:*",
      "COUNT",
      "100"
    );

    cursor = nextCursor;
  for (const key of keys) {
      const cachedToken = await redis.get(key);

      if (!cachedToken) {
        continue;
      }
      
      try {
       const tokenMetadata = JSON.parse(cachedToken) as {
          userId?: string;
          refresh?: string;
          familyId?: string;
        };
        // console.log(decoded)
       if (tokenMetadata?.userId === userId && tokenMetadata.familyId) {
          families.add(tokenMetadata.familyId);
        }
      } catch {
        // Ignore invalid refresh token data
      }
    }
  } while (cursor !== "0");
  for (const familyId of families) {
    await revokeRefreshTokenFamily(familyId, "PASSWORD_CHANGED");
  }
  return {
    userId,
    familiesRevoked: families.size,
  };

  }
