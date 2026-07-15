import { Request, Response, NextFunction } from "express"
import { registerBusinessOwnerService,
    businessLoginServicve,
    staffRegistrationService,
    staffLoginServicve,
    updateStaffPasswordService,
    getAllStaffService,
    editStaffProfileService,
    deleteStaffService,
    staffProfile,
    businessProfile,
    forgotPasswordService,
    resetStaffPasswordService,
    resetBusinessOwnerPasswordService
 } from "../services/authService"

import jwt from "jsonwebtoken";
 import { redis } from "../config/redis"
 import dotenv from "dotenv"
import { generateAccessToken } from "../ultil/generateToken"
dotenv.config()
 const recoverySecret = process.env.REFRESH_SECRET || " ";
export const registerBusinessOwnerController = async (req:Request,res:Response, next:NextFunction) =>{
    try{
        const {business_name,business_email,password,owner_name} = req.body
        const registrationPayload={
            business_name:business_name,
            business_email:business_email,
            password:password,
            owner_name:owner_name
        }
        const registerBusiness = await registerBusinessOwnerService(registrationPayload)
        return res.status(201).json({
            status: "success",
            message: "Business platform account created successfully!",
            data: registerBusiness
    });
    }catch(error){
        return next(error)
    }
}

export const handleBusinessLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { business_email, password } = req.body;

  try {
    const result = await businessLoginServicve(business_email, password);

    // 🔒 Cookie Security: Save the refresh token inside a secure HttpOnly block
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Active HTTPS only in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // Lasts for exactly 7 days
    });

    // Send the access token and profile metadata to the client dashboard browser
    return res.status(200).json({
      status: "success",
      message: "Login successful!",
      accessToken: result.accessToken,
      profile: result.profile
    });

  } catch (error) {
    return next(error); // Automatically routes to your global error handler middleware!
  }
};

//  staff registration controller 
export const staffRegistrationController = async (req:Request, res:Response, next:NextFunction)=>{
  try{
      const {email}= (req as any).user
      const {staff_name, staff_email} = req.body
      const data = {
        staff_name:staff_name,
        staff_email:staff_email,
        businessOwner_email:email
      }
      const createdStaff = await staffRegistrationService(data)
      res.status(201).json({
      status: "success",
      message: `Workstation profile registered successfully! Onboarding credentials dispatched to ${staff_email}.`,
      data: createdStaff
    });
  }catch(error){
    return next(error)
  }
}

//  staff login controller 
export const handleStaffLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { staff_email, password } = req.body;

  try {
    const result = await staffLoginServicve(staff_email, password);

    // 🔒 Cookie Security: Save the refresh token inside a secure HttpOnly block
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Active HTTPS only in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // Lasts for exactly 7 days
    });

    // Send the access token and profile metadata to the client dashboard browser
    return res.status(200).json({
      status: "success",
      message: "Login successful!",
      accessToken: result.accessToken,
      staff: result.staff
    });

  } catch (error) {
    return next(error); // Automatically routes to your global error handler middleware!
  }
};

//  logout controller
export const logoutController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = (req as any).user;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(' ')[1]; 

    const tokenExp = (req as any).user.exp;
    console.log(tokenExp)
    // 1. 🛡️ BLACKLIST ACCESS TOKEN IN FAST RAM CACHE LAYER
    if (accessToken && tokenExp) {
      const currentTime = Math.floor(Date.now() / 1000);
      const remainingTime = tokenExp - currentTime;

      // If the access token still has active time left on the clock, lock it down!
      if (remainingTime > 0) {
        const blacklistKey = `blacklist:${accessToken}`;
        // Cache the blacklisted signature with an explicit self-destructing TTL safety window
        await redis.set(blacklistKey, 'blacklisted', 'EX', remainingTime);
      }
    }

    // 2. 🧹 PURGE ALL REFRESH TOKEN ROW SLOTS
    const keys = await redis.keys(`refresh:${id}`);
    console.log(keys)
    if (keys.length > 0) {
      // 💡 THE ULTIMATE FIX: Use the spread operator (...keys) to pass items safely!
      await redis.del(...keys);
    }

    // 3. 🧼 WIPE CLIENT COOKIES BROWSER STORAGE CACHE
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
      status: "success",
      message: "Session terminated and token footprints cleared successfully."
    });
    return; // Satisfies Promise<void> type constraints cleanly

  } catch (error) {
    // 🛡️ Fail-Safe: Always strip client cookies even if your Redis instance stutters
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    next(error);
  }
}

//  update staff password controller
export const updateStaffPasswordController = async (req:Request, res:Response, next:NextFunction) =>{
  try{
    const {email}= (req as any).user
    const {new_password} = req.body
    const updatePassword = await updateStaffPasswordService(email,new_password)
    return res.status(201).json({
      status:"success",
      message:"password update successful!",
      updatePassword
    })
  }catch(error){
    return next(error)
  }
}

//  get allStaff controller 

export const handleGetAllStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract the businessId safely from the verified verifyAccessToken token payload
    const { id } = (req as any).user;
    console.log(id)
    const staffList = await getAllStaffService(id);

    return res.status(200).json({
      status: "success",
      results: staffList.length,
      data: staffList
    });
  } catch (error) {
    return next(error); // Route to globalErrorHandler middleware cleanly
  }
};

//  staff profile update controller
export const handleStaffProfileUpdateController = async (req:Request, res:Response, next:NextFunction) =>{
  try{
    const { id } = (req as any).user;
    const { staffId } = req.params;
    const {staff_name, staff_email, role} = req.body
    const data ={
      staff_name:staff_name,
      staff_email:staff_email,
      role:role
    }
     const updatedStaff = await editStaffProfileService(id, staffId, data);
   return res.status(200).json({
      status: "success",
      message: "Workstation terminal profile parameters updated successfully.",
      data: updatedStaff
    });

  }catch(error){
    return next(error)
  }
}

//  delete staff controllerv 
export const handleDeleteStaff = async (req:Request, res:Response, next:NextFunction) =>{
  try{
    const {id} = (req as any).user
    const { staffId} = req.params
    await deleteStaffService(id, staffId)
    return res.status(200).json({
      status:"success",
      message:"staff deleted succesfully"
    })
  }catch(error){
    return next(error)
  }
}

//  get staff and business profile data
export const handleGetDynamicProfileData = async (req:Request, res:Response, next:NextFunction) =>{
  try{
    const { email, role} = (req as any).user
    //  business owner profile data
    if(role==="OWNER"){
      const profileData = await businessProfile(email)
      return res.status(200).json({
        status:"succcess",
        message: "profile data retrieve succesful",
        data:profileData
      });
    }
    //  staff profile data
    if(role==="STAFF"){
      const profileData = await staffProfile(email)
      return res.status(200).json({
        status:"succcess",
        message: "profile data retrieve succesful",
        data:profileData
      })
    }
  }catch(error){
    return next(error)
  }
}

//  forgot password controller 
export const forgotPasswordController = async (req:Request, res:Response, next:NextFunction) => {
    try {
        const { email } = req.body;
         await forgotPasswordService(email)
          const recoveryToken = jwt.sign({ email: email }, recoverySecret, { expiresIn: "8m" });
            res.cookie("recoverySession", recoveryToken, {
                httpOnly: true, // Prevents malicious XSS browser scripts from reading their identity context!
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production",
                maxAge: 8 * 60 * 1000 // Cookie self-destructs inside the browser after 15 minutes
         });
        return res.status(200).json({
            status: "success",
            message: "Verification code sent to your email."
        });
    } catch (error) {
        return next(error);
    }
};
// resend otp controller 
export const handleResendForgotPasswordOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
         const { recoverySession } = req.cookies;
    const recoverySecret = process.env.REFRESH_SECRET || " ";

    if (!recoverySession) {
      res.status(401).json({ 
        status: "fail", 
        message: "Session Expired: Your 8-minute recovery timeline has run out. Please restart the forgot-password flow." 
      });
      return;
    }
      let decodedSession: any;
    try {
      decodedSession = jwt.verify(recoverySession, recoverySecret);
    } catch (err) {
      res.status(401).json({ status: "fail", message: "Unauthorized: Invalid or corrupted recovery session token." });
      return;
    }

    // Capture the email address safely resolved out of the secure cookie structure
    const targetUserEmail = decodedSession.email;
     const lockoutKey = `resend_lockout:${targetUserEmail}`;
    const isLockedOut = await redis.get(lockoutKey);
    console.log(isLockedOut)
    if (isLockedOut) {
      res.status(429).json({ 
        status: "fail", 
        code: "RATE_LIMIT_EXCEEDED", 
        message: "Rate Limit Exceeded: Please wait 1 minute before requesting another email dispatch." 
      });
      return;
    }
     const allActiveKeys = await redis.keys("password_reset_code:*");
     console.log(allActiveKeys)
    let activeOtpCodeToDeliver: string | null = null;

    // Iterate through all active reset keys in RAM to find if an unexpired token maps to this user's email
    for (const currentKey of allActiveKeys) {
      const mappedEmailValue = await redis.get(currentKey);
      if (mappedEmailValue === targetUserEmail) {
        // Extract the raw 6-digit numeric string right out of the key suffix block!
        activeOtpCodeToDeliver = currentKey.split(":")[1];
        break; // Found it! Stop searching immediately.
      }
    }
    if(activeOtpCodeToDeliver){
      return;
    }else{
      await forgotPasswordService(targetUserEmail)
    }
    await redis.set(lockoutKey, 'active', 'EX', 2*60);
    res.status(200).json({ 
      status: "success", 
      message: "A verification code has been successfully dispatched straight to your registered inbox." 
    });
    return;
  }catch(error){
    return next(error)
  }
}
// reset staff password controller
export const resetStaffPasswordController = async (req:Request, res:Response, next:NextFunction) =>{
    try{
        const {otpCode, new_password} = req.body
        await resetStaffPasswordService(otpCode,new_password)
        return res.status(200).json({
            status: "success",
            message: "Password updated successfully. You can now securely log back in."
        });
    }catch(error){
      return   next(error)
    }
}

// reset business owner password controller
export const resetBusinessOwnerPasswordController = async (req:Request, res:Response, next:NextFunction) =>{
    try{
        const {otpCode, new_password} = req.body
        await resetBusinessOwnerPasswordService(otpCode, new_password)
        return res.status(200).json({
            status: "success",
            message: "Password updated successfully. You can now securely log back in."
        });
    }catch(error){
      return   next(error)
    }
}
// refresh token controller
export const refreshTokenController = async(req:Request, res:Response, next:NextFunction):Promise<void> =>{
  try{
    const {email, id, role} = (req as any).user
        const newAccessToken = generateAccessToken(email, id, role)
         res.status(200).json({
            status: "success",
            message: "Access token token rotation executed successfully.",
            accessToken: newAccessToken
        });
        return;
  }catch(error){
    return next(error)
  }
}