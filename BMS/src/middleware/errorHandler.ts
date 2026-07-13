import { Request, Response, NextFunction } from 'express';
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.STATUS_CODES || 500
    if(statusCode === 500){
        console.log(
            "error:",err
        )
    }
    return res.status(statusCode).json({
    status: statusCode,
    message: err.message || 'An unexpected internal processing breakdown occurred.'
  });
}