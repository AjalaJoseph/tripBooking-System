import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"; // 💡 Fix: Import as lowercase 'jwt'
import dotenv from "dotenv";
import { redis } from "../config/redis.js"; // Note: path alignment

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "default_access_secret_key_123";

export const verifyAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ 
      status: "fail",
      error: 'Access denied. Security token required.' 
    });
  }

  try {
    // 1. Fast Redis Blacklist lookup checkpoint
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ 
        status: "fail", 
        message: "This session has been terminated. Please log in again." 
      });
    }

    // 2. Decode and cryptographically verify the token signature
    // 💡 Fix: Use 'jwt.verify' and cast the output explicitly as an object
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as {
        id:string,
        email:string
        role:string
        exp: number;         // 🚀 SUCCESS: Adds the native JWT UNIX expiration timestamp!
       iat: number;   
    }

    // 3. 🔒 Pass identity metrics securely down the middleware stream
    // 💡 Fix: Cast 'req' as 'any' to satisfy default Express type checking parameters
    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      role:decoded.role,
      exp:        decoded.exp,
      iat : decoded.iat
    };

    return next();

  } catch (err: any) {
    // Gracefully catch validation failures or expired tokens
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        status: "fail",
        error: 'Your session token has expired. Kindly refresh your access token.' 
      });
    }
    
    return res.status(403).json({ 
      status: "fail",
      error: 'Invalid or corrupted security token.' 
    });
  }
};
