import express, { Application } from "express";
import dotenv from "dotenv"
import cors, { CorsOptions } from "cors";
import helmet from "helmet"
import { authRouter } from "./src/routes/authRouter";
import { productRouter } from "./src/routes/productRouter";
import { saleRouter } from "./src/routes/salesRouter";
import { reportRouter } from "./src/routes/reportRouter";
import { subscriptionRouter } from "./src/routes/subscriptionRoute";
import cookiesParser from "cookie-parser"
import { globalErrorHandler } from "./src/middleware/errorHandler";
dotenv.config()
export const app:Application = express()
const corsConfigurationOptions: CorsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? "https://vercel.app" // Your live client website URL
    : "http://localhost:5173", 
   credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "idempotency-key", "x-paystack-signature"],
  exposedHeaders: ["x-paystack-signature"],
};
app.use(helmet())
app.use(cors(corsConfigurationOptions))
app.use(cookiesParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter)
app.use('/api', productRouter)
app.use("/api/sales", saleRouter)
app.use("/api", reportRouter)
app.use("/api", subscriptionRouter)
app.use(globalErrorHandler)