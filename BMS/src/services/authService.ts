
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
    staffResetPassword
 } from "../models/userModel";
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
export const businessOwnerLoginService= async (email:string, password:string) =>{
    const businessExist = await getBusinessAccount(email)
    if(!businessExist){
        throw Object.assign(new Error("Business not found"), {STATUS_CODES:404})
    }
    const isPasswordMatch = await bcrypt.compare(password,businessExist.password)
    if(!isPasswordMatch){
        throw Object.assign(new Error("Invalid crediential"), {STATUS_CODES:400})
    }
    let accessToken = "";
    let refreshToken = "";
    if(businessExist && businessExist.business_email){
         accessToken = generateAccessToken(businessExist.business_email, businessExist.id, businessExist.role)
         refreshToken = generateRefreshToken(businessExist.business_email, businessExist.id, businessExist.role)
    }
    const redisKey = `refresh:${businessExist.id}`;
    // Save to Redis and set it to expire automatically in 7 days (604,800 seconds)
    // "EX" stands for expiration in seconds
    await redis.set(redisKey, refreshToken, "EX", 7 * 24 * 60 * 60);
    delete (businessExist as any).password;
    return{
        business:businessExist,
        accessToken,
        refreshToken
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
    console.log(temporaryPassword)
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
    const isPasswordMatch = await bcrypt.compare(password,staffExist.password)
    if(!isPasswordMatch){
        throw Object.assign(new Error("Invalid crediential"), {STATUS_CODES:400})
    }
    let accessToken = "";
    let refreshToken = "";
    if(staffExist && staffExist.staff_email){
         accessToken = generateAccessToken(staffExist.staff_email, staffExist.id,staffExist.role )
         refreshToken = generateRefreshToken(staffExist.staff_email, staffExist.id, staffExist.role)
    }
    const redisKey = `refresh:${staffExist.id}`;
    await redis.set(redisKey, refreshToken, "EX", 7 * 24 * 60 * 60)
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
  const staffExist = await getStaffData(email);
  if (!staffExist) {
    throw Object.assign(
      new Error('This email record is not registered on our active workspace index.'),
      { STATUS_CODES: 404 }
    );
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // 2. 🚀 THE INVERSION FIX: Use the OTP as the KEY and save the EMAIL as the VALUE!
  const redisOtpTrackingKey = `password_reset_code:${otpCode}`;
  
  // ⏳ ENFORCE TIMELINE GATE: Key completely self-destructs from RAM in exactly 60 seconds!
  await redis.set(redisOtpTrackingKey, staffExist.staff_email, 'EX', 5*60);

  // 3. Drop notification metadata payload onto your background BullMQ worker queue
  await onboardingQueue.add("forgot-password-otp", {
    email:    staffExist.staff_email,
    userName: staffExist.staff_name,
    otpcode:  otpCode 
  });

  return { status: "success", message: "Verification token dispatched to registered inbox." };
};
//  staff reset password service
export const resetStaffPasswordService = async (otpCode :string, password:string) =>{
     const valkeyCodeKey = `password_reset_code:${otpCode}`;
    const verifyOtp = await redis.get(valkeyCodeKey)
    if(!verifyOtp){
        throw Object.assign(new Error("Invalid or expired verification code sequence. Please request a new code."), {STATUS_CODES:400})
    }
    const newHashPasword = await bcrypt.hash(password, 12)
    const email = verifyOtp
    const newPassword = await staffResetPassword(email, newHashPasword)
     await redis.del(valkeyCodeKey);
    return newPassword
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