import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.STATUS_CODES || 500
    const retryAfter = err.retryAfter;
    if (err.code === "ENOTFOUND" || err.code === "ETIMEDOUT" || err.code === "ECONNRESET") {
    //  logger.warn(`❌ [Global Error Handler Intercept] Caught infrastructure drop ${err.code}: ${err.message}`);
    
    // Force an HTTP 503 Service Unavailable so your React app can catch it gracefully [S4]
    return res.status(503).json({
      status: 503,
      code: "EXTERNAL_NETWORK_ERROR", // Unique text tag sent straight to your PricingPlans cards [S4]
      message: "Network Link Issue: Unable to connect to the external payment gateway. Your store session is completely safe, please check your internet connection and try again."
    });
  }

  // =========================================================================
  // 🛡️ THE OPOSSUM CIRCUIT BREAKER SHIELD INTERCEPTOR
  // =========================================================================
      if (err.name === "OpenCircleError" || err.message === "OpenCircleError") {
        logger.error("🛡️ [Global Error Handler Intercept] Opossum circuit breaker is OPEN. Deflecting request.");
        return res.status(503).json({
          status: 503,
          code: "SYSTEM_BUSY",
          message: "System Busy: The external payment gateway is currently down or unresponsive. Please try again in 30 seconds."
        });
      }

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
     const response: {status: number; message: string; retryAfter?: number;} = {
        status: statusCode,
        message: err.message ||"An unexpected internal processing breakdown occurred.",
    };

  if (retryAfter !== undefined) {
    response.retryAfter = retryAfter;
  }

  return res.status(statusCode).json(response);
}