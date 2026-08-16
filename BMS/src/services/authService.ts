import crypto from "crypto"
import { registerBusinessOwner,
    getBusinessAccount,
    getStaffData,
    registerStaff,
    updateStaffPassword,
    getAllStaff,
    checkStaff,
    editStaffProfile,
    deleteStaff,
    businessOwnerResetPassword,
    staffResetPassword,
    deActivateStaffModel
 } from "../models/userModel";
 import { accountBucketService } from "../middleware/accountBucket";
 import { hashRefreshToken } from "../ultil/hashToken";
 import bcrypt from "bcrypt";
 import {redis} from "../config/redis"
 import { onboardingQueue } from "../backgroundQueues/emailQueues";
 import { generateAccessToken, generateRefreshToken } from "../ultil/generateToken";
 import {generateTemporaryPassword} from "../ultil/generateTemporaryPassword"
export const registerBusinessOwnerService = async (data:any) =>{
    const businessExist = await getBusinessAccount(data.business_email)
    if(businessExist){
        throw Object.assign(new Error("email already exist"), {STATUS_CODES:409})
    }
    const passwordHash = await bcrypt.hash(data.password,12)
    const registrationPayload ={
        business_name:data.business_name,
        business_email:data.business_email,
        owner_name:data.owner_name,
        passwordHash:passwordHash
    }
    const register = await registerBusinessOwner(registrationPayload)
    if(register && register.business){
        delete (register.business as any).password
    }
    return register
}

//  business owner login service
export const businessLoginServicve = async (email:string, password:string) =>{
    const businessExist = await getBusinessAccount(email)
    if(!businessExist){
       throw Object.assign(new Error("Business not found"), {STATUS_CODES:404})
    }
    const account = await accountBucketService.isBlocked(businessExist.id);

        if (account.blocked) {
        throw Object.assign(
            new Error("Too many failed login attempts. Please wait until the account is unlocked."),
            { STATUS_CODES: 429, retryAfter:account.retryAfter }
        );
        }

        const isPasswordMatch = await bcrypt.compare(
        password,
        businessExist.password
        );

        if (!isPasswordMatch) {
        const result = await accountBucketService.recordFailure(businessExist.id);

        if (result.blocked) {
            throw Object.assign(new Error("Too many failed login attempts. Please wait until the account is unlocked."),
            { STATUS_CODES: 429, retryAfter:900 }
            );
        }

        if (result.attempts>=4) {
            throw Object.assign(
            new Error("Invalid credentials. You have 1 login attempt remaining."),
            { STATUS_CODES: 400 }
            );
        }

        throw Object.assign(new Error("Invalid credentials."),{ STATUS_CODES: 400 });
        }
        // let accessToken = "";
        // let refreshToken = "";
        // if(businessExist && businessExist.business_email){

            const familyId = crypto.randomUUID();
          const  accessToken = generateAccessToken(
                    String(businessExist.business_email), 
                    String(businessExist.id),
                    String(businessExist.role) 
                )
           const {token:refreshToken, jti} = generateRefreshToken(
                String(businessExist.business_email), 
                String(businessExist.id),
                familyId,
                String(businessExist.role) 
            )  
            const refreshTokenHash = hashRefreshToken(refreshToken)     
        //  }
         accountBucketService.clear(businessExist.id)
            const redisKey = `refresh:${jti}`;
           await redis.set(redisKey, JSON.stringify({userId: businessExist.id, refresh:refreshTokenHash,}), "EX", 7 * 24 * 60 * 60);
           await redis.sadd(`refresh-family:${familyId}`,jti);
           delete (businessExist as any).password
            return{
                accessToken,
                refreshToken,
                profile:{
                id:businessExist.id,
                business_name:businessExist.business_name,
                business_email:businessExist.business_email,
                role:businessExist.role
                }
            }
}


// staff registration service
export const staffRegistrationService = async (data:any)=>{
    const staffExist = await getStaffData(data.staff_email)
   if(staffExist){
        throw Object.assign(new Error("email already exist"), {STATUS_CODES:409})
    }
    let owner_name =""
    let business_id =""
    const businessOwnerData = await getBusinessAccount(data.businessOwner_email)
    if(businessOwnerData && businessOwnerData.business_name){
        owner_name = businessOwnerData.business_name
        business_id=businessOwnerData.id
    }
    const temporaryPassword = generateTemporaryPassword(10)
    // console.log(temporaryPassword)
    const passwordHash = await bcrypt.hash(temporaryPassword,12)
    const registrationPayload={
        business_id:business_id,
        staff_name:data.staff_name,
        staff_email:data.staff_email,
        password:passwordHash
    }
    const mailPayload ={
        staff_name:data.staff_name,
        staff_email:data.staff_email,
        password:temporaryPassword,
        owner_name:owner_name
    }
    const createStaff = await registerStaff(registrationPayload)

     await onboardingQueue.add('send-welcome-email',mailPayload)
    // console.log(me)
    delete(createStaff as any).password
    return createStaff
}

//  staff login service
export const staffLoginServicve = async (email:string, password:string) =>{
    const staffExist = await getStaffData(email)
    if(!staffExist){
       throw Object.assign(new Error("Staff not found"), {STATUS_CODES:404})
    }

    if(staffExist.isActive === false){
        throw Object.assign(new Error("Your staff account has been deactivated by management. Please contact your administrator."), {
            STATUS_CODES: 403 
         });
    }
     const account = await accountBucketService.isBlocked(staffExist.id);

        if (account.blocked) {
        throw Object.assign( new Error("Too many failed login attempts. Please wait until the account is unlocked."),
            { STATUS_CODES: 429, retryAfter:account.retryAfter }
        );
        }

        const isPasswordMatch = await bcrypt.compare(password, staffExist.password);
        if (!isPasswordMatch) {
        const result = await accountBucketService.recordFailure(staffExist.id);

        if (result.blocked) {
            throw Object.assign(new Error("Too many failed login attempts. Please wait until the account is unlocked."),
            { STATUS_CODES: 429, retryAfter:900 }
            );
        }

        if (result.attempts>=4) {
            throw Object.assign(
            new Error(
                "Invalid credentials. You have 1 login attempt remaining."
            ),
            { STATUS_CODES: 400 }
            );
        }

        throw Object.assign(
            new Error("Invalid credentials."),
            { STATUS_CODES: 400 }
        );
        }
    // let accessToken = "";
    // let refreshToken = "";
    // if(staffExist && staffExist.staff_email){
        const familyId = crypto.randomUUID();
         const accessToken = generateAccessToken(staffExist.staff_email, staffExist.id,staffExist.role )
         const{token:refreshToken, jti} = generateRefreshToken(staffExist.staff_email, staffExist.id, familyId,staffExist.role)
         const refreshTokenHash = hashRefreshToken(refreshToken)
    // }
        accountBucketService.clear(staffExist.id)
        const redisKey = `refresh:${jti}`;
        await redis.set(redisKey, JSON.stringify({userId: staffExist.id, refresh:refreshTokenHash,}), "EX",7 * 24 * 60 * 60);
        await redis.sadd(`refresh-family:${familyId}`,jti);
        delete (staffExist as any).password
        return{
            staff:staffExist,
            accessToken,
            refreshToken
        }
}

//  change staff temporary password service
export const updateStaffPasswordService = async (email:string, password:string) =>{
    const staffExist= await getStaffData(email)
    if(!staffExist){
        throw Object.assign(new Error("staff not found"), {STATUS_CODES:404})
    }
    const hashPassword = await bcrypt.hash(password,12)
    const update = await updateStaffPassword(email, hashPassword)
    delete(update as any).password
    return update
}

//  get all staff register by business owner
export const getAllStaffService = async (businessId:string) =>{
    return await getAllStaff(businessId)
}

//  edit staff details
export const editStaffProfileService = async (businessId:string, staff_id:any, updateData:any) =>{
    const staff = await checkStaff(staff_id, businessId)
    if(!staff){
        throw Object.assign(new Error("Unauthorized: Staff profile not found or does not belong to your store directory."), {STATUS_CODES:403})
    }
    const mappingPayload = {
            id: staff_id,
            business_id: businessId,
            name: updateData.staff_name || staff.staff_name,     // Falls back to existing database value if empty
            email: updateData.staff_email || staff.staff_email,   // Falls back to existing database value if empty
            role: updateData.role || staff.role,
            status: updateData.isActive !== undefined ? updateData.isActive : staff.isActive
  };
  const mailPayload ={
        staff_name:updateData.staff_name || staff.staff_name,
        staff_email: updateData.staff_email || staff.staff_email, 
         role: updateData.role || staff.role,
        status: updateData.isActive !== undefined ? updateData.isActive : staff.isActive,
        owner_name:staff.business.owner_name
    }
    const updateProfile = await editStaffProfile(mappingPayload)
    await onboardingQueue.add('send-profile-update',mailPayload)
  return updateProfile
}

//  delete staff register by business owner service 
 export const deleteStaffService = async (business_id:string, staff_id:any) =>{
    const checkStaffExist = await checkStaff(staff_id, business_id)
    if(!checkStaffExist){
        throw Object.assign(new Error("Unauthorized: Staff profile not found or does not belong to your store directory."), {STATUS_CODES:404})
    }
    return await deleteStaff(staff_id)
 }

//   deActivate staff service
 export const deActivateStaffService = async (business_id:string, staff_id:any) =>{
    const checkStaffExist = await checkStaff(staff_id, business_id)
    if(!checkStaffExist){
        throw Object.assign(new Error("Unauthorized: Staff profile not found or does not belong to your store directory."), {STATUS_CODES:404})
    }
    const nextStaffStatus = !checkStaffExist.isActive;
    return await deActivateStaffModel(staff_id, business_id,nextStaffStatus)
 }
//   get staff account data
export const staffProfile = async (email:string) =>{
    const data = await getStaffData(email)
    delete (data as any).password
    return data
}
//   get business account data
export const businessProfile = async (email:string) =>{
    const profileData = await getBusinessAccount(email)
    delete (profileData as any ).password
    return profileData
}

//  reset password for business owner
export const forgotPasswordService = async (email: string) => {
    const [ownerAccountExist, staffAccountExist] = await Promise.all([
    await  getBusinessAccount(email),
    await   getStaffData(email)
  ]);

  if (!ownerAccountExist && !staffAccountExist) {
    throw Object.assign(
      new Error('This email record is not registered on our active workspace index.'),
      { STATUS_CODES: 404 }
    );
  }
 const validatedRoles: ("OWNER" | "STAFF")[] = [];
  let preferredDisplayName = "Workspace User";

  if (ownerAccountExist) {
    validatedRoles.push("OWNER");
    preferredDisplayName = ownerAccountExist.business_name || preferredDisplayName;
  }
  if (staffAccountExist) {
    validatedRoles.push("STAFF");
    preferredDisplayName = staffAccountExist.staff_name || preferredDisplayName;
  }
  

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const redisOtpTrackingKey = `password_reset_code:${otpCode}`;
  const sessionId = crypto.randomUUID()
   const cacheDataPayload = {
    email: email,
    availableRoles: validatedRoles // e.g. ["OWNER", "STAFF"] if duplicate exists!
  };
  await redis.set(redisOtpTrackingKey, JSON.stringify(cacheDataPayload), 'EX', 3*60);
  await redis.set(`reset:${sessionId}`, JSON.stringify({ email:email, name:preferredDisplayName }), 'EX', 480)
  await onboardingQueue.add("forgot-password-otp", {
    email:    email,
    userName: preferredDisplayName,
    otpcode:  otpCode 
  });

  return { status: "success", sessionId:sessionId, message: "Verification token dispatched to registered inbox." };
};
//  staff reset password service
export const resetPasswordService = async (otpCode :string, password:string) =>{
     const redisOtpTrackingKey = `password_reset_code:${otpCode}`;
  const cachedData = await redis.get(redisOtpTrackingKey);
  if (!cachedData) {
    throw Object.assign(
      new Error('Invalid Token: This verification OTP code has expired or is incorrect.'), 
      { STATUS_CODES: 400 }
    );
}
      const { email, availableRoles } = JSON.parse(cachedData)
      if(availableRoles ==="OWNER"){
        const newHashPasword = await bcrypt.hash(password, 12)
         const newPassword = await businessOwnerResetPassword(email, newHashPasword)
          await redis.del(redisOtpTrackingKey);
         return newPassword
      };

      if(availableRoles === "STAFF"){
        const newHashPasword = await bcrypt.hash(password, 12)
         const newPassword = await staffResetPassword(email, newHashPasword)
          await redis.del(redisOtpTrackingKey);
         return newPassword
      } 
}

// reset business owner password service
export const resetBusinessOwnerPasswordService = async (otpCode :string, password:string) =>{
     const valkeyCodeKey = `password_reset_code:${otpCode}`;
    const verifyOtp = await redis.get(valkeyCodeKey)
    if(!verifyOtp){
        throw Object.assign(new Error("Invalid or expired verification code sequence. Please request a new code."), {STATUS_CODES:400})
    }
    const newHashPasword = await bcrypt.hash(password, 12)
    const email = verifyOtp
    const newPassword = await businessOwnerResetPassword(email, newHashPasword)
     await redis.del(valkeyCodeKey);
    return newPassword
}

// refresh token rotation service 
export const refrsehTokenRotationService = async (email:string, id:string, role:string, oldJti:string, familyId:string) =>{
    const oldRefreshKey = `refresh:${oldJti}`;
     const revokedKey = `revoked-refresh:${oldJti}`;
     const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;
      const atomicConsumeScript = `
            local oldSession = redis.call("GET", KEYS[1])

            if not oldSession then
            return 0
            end

            redis.call("DEL", KEYS[1])

            redis.call(
            "SET",
            KEYS[2],
            ARGV[1],
            "EX",
            ARGV[2]
            )

            return 1
        `;

        const consumed = await redis.eval(
                atomicConsumeScript,
                2,
                oldRefreshKey,
                revokedKey,
                JSON.stringify({
                userId: id,
                familyId:familyId,
                reason: "ROTATED",
                }),
                REFRESH_TOKEN_TTL
            );
             if (consumed !== 1) {
                return {
                success: false,
                reuseDetected: true,
                };
            }
        const {token: newRefreshToken, jti: newJti,} = generateRefreshToken(email,id,familyId,role);
        const newRefreshTokenHash = hashRefreshToken(newRefreshToken)
        await redis.set( `refresh:${newJti}`, JSON.stringify({userId: id, refresh: newRefreshTokenHash,}),"EX",REFRESH_TOKEN_TTL );
        await redis.sadd(`refresh-family:${familyId}`, newJti);
        return {
            success: true,
            reuseDetected: false,
            refreshToken: newRefreshToken,
            jti: newJti,
        };
}