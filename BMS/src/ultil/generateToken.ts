import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_SECRET || "";

export const generateAccessToken = (email: string, id: string, role:string): string => {
  const payload = {
     id:     id,     // 💡 Must be the database UUID string!
    email:  email,  // Must be their staff_email string
    role:   role
  };

 const tokenExpire = (process.env.JWT_EXPIRES_IN || "15m") as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: tokenExpire 
  });
};


export const generateRefreshToken = (email: string, id:string, familyId:string, role:string)=>{
   const jti = randomUUID();
  const payload = {
     id:     id,     // 💡 Must be the database UUID string!
    email:  email,  // Must be their staff_email string
    role:   role,
    jti:jti,
    familyId:familyId
  };
  const refreshExpire =  (process.env.REFREESH_TOKEN_EXPIRES_IN  || "7d") as jwt.SignOptions['expiresIn'];
  const token = jwt.sign(payload, REFRESH_TOKEN_SECRET, {expiresIn: refreshExpire});
  return{
    token,
    jti
  }
};
