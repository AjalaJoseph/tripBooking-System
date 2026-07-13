import { Router } from "express"
import { registerBusinessOwnerController,
    handleBusinessLogin,
    staffRegistrationController,
    handleStaffLogin,
    updateStaffPasswordController,
    handleGetAllStaff,
    handleStaffProfileUpdateController,
    handleDeleteStaff,
    handleGetDynamicProfileData,
    logoutController,
    refreshTokenController,
    forgotPasswordController,
    resetStaffPasswordController,
    resetBusinessOwnerPasswordController,
    handleResendForgotPasswordOTP
 } from "../controllers/authController"
import { validateBusinessAccountInput,
     validateloginInput, 
     validateStaffInput,
     validateStaffLoginInput,
     validateStaffPasswordInput,
    ValidateForgotPasswordEmail,
    ValidateResetPasswordInput
 } from "../validators/authValidator"
 import { verifyAccessToken } from "../middleware/verifyAccessToken"
import { verifyRefreshToken } from "../middleware/verifyRefreshToken"
 import { enforceSubscriptionGate } from "../middleware/subscription"
export const authRouter = Router()
authRouter.post('/register-business', validateBusinessAccountInput, registerBusinessOwnerController)
authRouter.post('/login-business', validateloginInput, handleBusinessLogin)
authRouter.post('/register-staff', verifyAccessToken, enforceSubscriptionGate, validateStaffInput, staffRegistrationController)
authRouter.post('/login-staff', validateStaffLoginInput,handleStaffLogin )
authRouter.patch('/change-staff-password', verifyAccessToken, validateStaffPasswordInput,updateStaffPasswordController)
authRouter.get('/all-staff', verifyAccessToken, handleGetAllStaff)
authRouter.patch("/:staffId/edit-staff", verifyAccessToken,enforceSubscriptionGate, validateStaffInput, handleStaffProfileUpdateController);
authRouter.delete('/:staffId/remove-staff', verifyAccessToken, handleDeleteStaff)
authRouter.get("/me",verifyAccessToken, handleGetDynamicProfileData)
authRouter.post("/logout", verifyAccessToken, logoutController)
authRouter.post("/refresh-token", verifyRefreshToken, refreshTokenController)
authRouter.post("/forgot-password",ValidateForgotPasswordEmail, forgotPasswordController)
authRouter.post("/reset-password/staff", ValidateResetPasswordInput, resetStaffPasswordController)
authRouter.post("/reset-password/owner", ValidateResetPasswordInput, resetBusinessOwnerPasswordController)
authRouter.post("/resend-otp", handleResendForgotPasswordOTP)