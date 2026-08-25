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

 const tokenExpire: jwt.SignOptions['expiresIn'] = (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || "15m";
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
 const refreshExpire: jwt.SignOptions['expiresIn'] = (process.env.REFREESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn']) || "7d";
const token = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: refreshExpire });
return {
  token,
  jti
};
};
