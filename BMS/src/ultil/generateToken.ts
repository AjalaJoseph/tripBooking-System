import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "default_access_secret_key_123";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_SECRET || "default_refresh_secret_key_456";

export const generateAccessToken = (email: string, id: string, role:string): string => {
  const payload = {
     id:     id,     // 💡 Must be the database UUID string!
    email:  email,  // Must be their staff_email string
    role:   role
  };

 const tokenExpire = (process.env.JWT_EXPIRES_IN || "30m") as jwt.SignOptions['expiresIn'];
  
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: tokenExpire 
  });
};

/**
 * 🔄 Append this: Generates a long-lived Refresh Token.
 * This will be stored inside a secure HttpOnly cookie on login.
 */
export const generateRefreshToken = (email: string, id:string, role:string): string => {
  const payload = {
     id:     id,     // 💡 Must be the database UUID string!
    email:  email,  // Must be their staff_email string
    role:   role
  };
  const refreshExpire =  (process.env.REFREESH_TOKEN_EXPIRES_IN  || "3d") as jwt.SignOptions['expiresIn'];

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: refreshExpire
  });
};
