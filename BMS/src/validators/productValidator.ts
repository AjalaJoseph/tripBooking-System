import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateBulkProductInput = [
  // 1. Ensure 'products' exists as a non-empty array block
  body('products')
    .isArray({ min: 1 }).withMessage('The input payload must contain at least 1 product record block.'),
    // .custom((array) => {
    //   // 💡 Enforce your custom limit ceiling rule
    //   if (array.length > 5) {
    //     throw new Error('Bulk operation limit exceeded: You can only upload a maximum of 5 products concurrently.');
    //   }
    //   return true;
    // }),

  // 2. Validate individual parameters inside every array item row dynamically
  // 💡 Note: These property names match your schema columns perfectly!
  body('products.*.product_name')
    .trim()
    .notEmpty().withMessage('Product name field is required for all item rows.')
    .isLength({ min: 2 }).withMessage('Product name must be at least 2 characters long.'),

  body('products.*.sellingPrice')
    .notEmpty().withMessage('Selling price is required for all rows.')
    .isFloat({ min: 0.01 }).withMessage('Selling price must be a valid positive float number (greater than 0).'),

  body('products.*.quantity')
    .notEmpty().withMessage('Quantity count value is required for all rows.')
    .isInt({ min: 0 }).withMessage('Quantity count value must be a valid non-negative integer (0 or greater).'),

  // 3. Centralised response catcher middleware function
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      // Extracts and handles the first readable validation text block error string
      const errorMessage = errors.array()[0].msg;
      
      return res.status(400).json({
        status: "fail",
        message: errorMessage
      });
    }
    
    return next();
  }
];

//  update product validator
export const validateEditProductInput = [
  body('product_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Product name cannot be empty if provided')
    .isLength({ min: 2 }).withMessage('Product name must be at least 2 characters long.'),

  body('sellingPrice')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Selling price must be a valid positive float number.'),

  body('quantity')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock count value must be a valid non-negative integer.'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "fail",
        message: errors.array()[0].msg
      });
    }
    return next();
  }
];