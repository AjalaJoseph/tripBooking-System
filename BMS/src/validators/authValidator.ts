import { Request, Response, NextFunction } from 'express'; // 💡 Imported Express types
import { body, validationResult } from 'express-validator';

export const validateBusinessAccountInput = [
  body('business_name')
    .trim()
    .notEmpty().withMessage("Business Name field is required")
    .isLength({ min: 3 }).withMessage('Business Name must be greater than 3'),
    
  body("business_email")
    .trim()
    .notEmpty().withMessage("Business Email field is required")
    .isEmail().withMessage('Kindly provide a valid business email address')
    .normalizeEmail(),
    
  body('owner_name')
    .trim()
    .notEmpty().withMessage('Owner name is required'),
    
  body('password')
    .notEmpty().withMessage("password field is required") // Removed .trim() for character flexibility
    .isStrongPassword().withMessage("password must be at least 8 character contain 1 uppercase, 1 lowercase, 1 symbol, and number"),

  // 💡 Explicitly type your middleware arguments to satisfy the compiler
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return res.status(400).json({
        status: "fail",
        message: errorMessage
      });
    } 
    return next();
  }
];


// validate login input
export const validateloginInput=[
  body("business_email")
    .trim()
    .notEmpty().withMessage("Business Email field is required")
    .isEmail().withMessage('Kindly provide a valid business email address')
    .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage("password field is required"),

       (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
          const errorMessage = errors.array()[0].msg;
          return res.status(400).json({
            status: "fail",
            message: errorMessage
          });
        } 
        return next();
  }
]

//  validate register staff input
export const validateStaffInput = [
  body('staff_name')
    .trim()
    .notEmpty().withMessage('Staff name field is required')
    .isLength({ min: 3 }).withMessage('Staff name must be at least 3 characters long'),
    
  body('staff_email')
    .trim()
    .notEmpty().withMessage('Staff email field is required')
    .isEmail().withMessage('Kindly provide a valid staff email address')
    .normalizeEmail(),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          const errorMessage = errors.array()[0].msg;
          return res.status(400).json({
            status: "fail",
            message: errorMessage
          });
        } 
        return next();
  }
]

// validate staff login input
export const validateStaffLoginInput=[
  body("staff_email")
    .trim()
    .notEmpty().withMessage("Business Email field is required")
    .isEmail().withMessage('Kindly provide a valid business email address')
    .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage("password field is required"),

       (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
          const errorMessage = errors.array()[0].msg;
          return res.status(400).json({
            status: "fail",
            message: errorMessage
          });
        } 
        return next();
  }
]
// validate password change
export const validateStaffPasswordInput =[
  body('new_password')
    .notEmpty().withMessage("password field is required") // Removed .trim() for character flexibility
    .isStrongPassword().withMessage("password must be at least 8 character contain 1 uppercase, 1 lowercase, 1 symbol, and number"),

  // 💡 Explicitly type your middleware arguments to satisfy the compiler
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return res.status(400).json({
        status: "fail",
        message: errorMessage
      });
    } 
     return next()
  }
   
]

//  forgot password email validator
export const ValidateForgotPasswordEmail = [
    body("email")
    .trim()
    .notEmpty()
    .withMessage('Email field is required')
    .isEmail().withMessage('Invalid email format'),
      (req:Request, res:Response, next:NextFunction) =>{
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            const errorMessage = errors.array()[0].msg
            return res.status(400).json({
                status:"fail",
                message:errorMessage
            })
        } 
        return next()
    }
]

//  reset password validator
export const ValidateResetPasswordInput = [
    body("otpCode")
    .trim()
    .notEmpty()
    .withMessage('otpCode field is required'),
    body('new_password')
    .trim()
    .notEmpty().withMessage('New password field is required')
    .isStrongPassword()
    .withMessage("password must be at least 8 characters including 1 lower case 1 upper case, 1 number and 1 symbol"),
   
      (req:Request, res:Response, next:NextFunction) =>{
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            const errorMessage = errors.array()[0].msg
            return res.status(400).json({
                status:"fail",
                message:errorMessage
            })
        } 
        return next()
    }
]