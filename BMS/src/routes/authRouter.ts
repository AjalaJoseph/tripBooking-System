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
 import { checkSubscriptionActive, enforceStaffLimit } from "../middleware/subscription"
 import { authRateLimiter } from "../middleware/rateLimit"
export const authRouter = Router()
authRouter.post('/register-business', validateBusinessAccountInput, registerBusinessOwnerController)
authRouter.post('/login-business', authRateLimiter, validateloginInput, handleBusinessLogin)
authRouter.post('/register-staff', verifyAccessToken, checkSubscriptionActive,enforceStaffLimit, validateStaffInput, staffRegistrationController)
authRouter.post('/login-staff',authRateLimiter, validateStaffLoginInput,handleStaffLogin )
authRouter.patch('/change-staff-password', verifyAccessToken, validateStaffPasswordInput,updateStaffPasswordController)
authRouter.get('/all-staff', verifyAccessToken, handleGetAllStaff)
authRouter.patch("/:staffId/edit-staff", verifyAccessToken, validateStaffInput, handleStaffProfileUpdateController);
authRouter.delete('/:staffId/remove-staff', verifyAccessToken, handleDeleteStaff)
authRouter.get("/me",verifyAccessToken, handleGetDynamicProfileData)
authRouter.post("/logout", verifyAccessToken, logoutController)
authRouter.post("/refresh-token", verifyRefreshToken, refreshTokenController)
authRouter.post("/forgot-password",authRateLimiter, ValidateForgotPasswordEmail, forgotPasswordController)
authRouter.post("/reset-password/staff", ValidateResetPasswordInput, resetStaffPasswordController)
authRouter.post("/reset-password/owner", ValidateResetPasswordInput, resetBusinessOwnerPasswordController)
authRouter.post("/resend-otp", handleResendForgotPasswordOTP)