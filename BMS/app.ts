import express, { Application } from "express";
import dotenv from "dotenv"
import cors, { CorsOptions } from "cors";
import helmet from "helmet"
import { httpMetrics } from "./src/middleware/httpMetrics";
import { authRouter } from "./src/routes/authRouter";
import { productRouter } from "./src/routes/productRouter";
import { saleRouter } from "./src/routes/salesRouter";
import { reportRouter } from "./src/routes/reportRouter";
import { subscriptionRouter } from "./src/routes/subscriptionRoute";
import healthRouter from "./src/routes/healthRoute";
import metricsRoute from "./src/routes/metricsRoute";
import cookiesParser from "cookie-parser"
import { globalErrorHandler } from "./src/middleware/errorHandler";
dotenv.config()
export const app:Application = express()
// app.use((req, res, next) => {
//   console.log("🔥 REQUEST RECEIVED:", req.method, req.originalUrl);
//   next();
// });
const corsConfigurationOptions: CorsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? "https://vercel.app" // Your live client website URL
    : "http://localhost:5173", 
   credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS",],
  allowedHeaders: ["Content-Type", "Authorization", "idempotency-key", "x-paystack-signature"],
  exposedHeaders: ["x-paystack-signature"],
};
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows React to read images/data streams
  crossOriginOpenerPolicy: { policy: "unsafe-none" }      // Prevents cookie blocking across localhost ports
}));
app.use(cors(corsConfigurationOptions))
app.use(cookiesParser())
app.use(express.json({
  verify: (req: any, res, buf) => {
    // Looks for your webhook endpoint signature path string
    if (req.originalUrl && req.originalUrl.includes('subscribe-webhook')) {
      req.rawBody = buf.toString('utf-8'); 
      // console.log("🛰️ [Raw Body Interceptor]: Raw string buffer captured flawlessly.");
    }
  }
}));
app.use(httpMetrics);
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter)
app.use('/api', productRouter)
app.use("/api/sales", saleRouter)
app.use("/api", reportRouter)
app.use("/api", subscriptionRouter)
app.use("/api", healthRouter)
app.use("/api", metricsRoute)
app.use(globalErrorHandler)