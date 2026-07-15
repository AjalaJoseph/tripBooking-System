import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateSalesCheckoutInput = [
  // 1. Validate Core Transaction Parameters
  body('payment_method')
    .trim()
    .notEmpty().withMessage('Payment method selection handle is required.')
    .isIn(['CASH', 'CARD', 'TRANSFER']).withMessage('Invalid payment method. Choose exactly: CASH, CARD, or TRANSFER.'),

  // 2. Validate Products Shopping Basket Array
  body('items')
    .isArray({ min: 1 }).withMessage('The transaction payload must contain a products array block with at least 1 item.'),

  // 3. Dynamically Scan Every Field Inside the Products Array Row Blocks
  body('items.*.product_name')
    .trim()
    .notEmpty().withMessage('Product name is required for all line items.'),

  body('items.*.unit_price')
    .notEmpty().withMessage('Unit price parameter is required for all items.')
    .isFloat({ min: 0.01 }).withMessage('Unit price must be a valid positive float number greater than 0.'),

  body('items.*.quantity')
    .notEmpty().withMessage('Quantity value is required for all line items.')
    .isInt({ min: 1 }).withMessage('Quantity must be a valid positive integer greater than 0.'),

//   body('products.*.productId')
//     .optional({ nullable: true })
//     .trim()
//     .isUUID().withMessage('If a unique product identifier is supplied, it must be a valid UUID string format.'),

  // 4. Centralised Response Catcher Middleware Interceptor
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      // Safely capture and extract the first readable error text message text string
      const errorMessage = errors.array()[0].msg;
      
      return res.status(400).json({
        status: "fail",
        message: errorMessage
      });
    }
    
    return next();
  }
];
