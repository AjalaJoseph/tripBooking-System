import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.STATUS_CODES || 500
     if(statusCode === 500){
         logger.error({
        message: err.message || "An unexpected application error occurred.",
        error: err, // Captures the exact stack trace line numbers for Sentry
        body: req.body,
        params: req.params,
        query: req.query,
        meta: {
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            // userId: (req as any).user.id || "Unauthenticated"
        }
    });
    }
    return res.status(statusCode).json({
    status: statusCode,
    message: err.message || 'An unexpected internal processing breakdown occurred.'
  });
}