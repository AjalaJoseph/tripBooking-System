import express, { Application } from "express";
import { Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet"
import { authRouter } from "./src/routes/authRouter";
import { productRouter } from "./src/routes/productRouter";
import { saleRouter } from "./src/routes/salesRouter";
import { reportRouter } from "./src/routes/reportRouter";
import { subscriptionRouter } from "./src/routes/subscriptionRoute";
import cookiesParser from "cookie-parser"
import { globalErrorHandler } from "./src/middleware/errorHandler";
export const app:Application = express()
const corsConfigurationOptions: CorsOptions = {
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-paystack-signature"],
  exposedHeaders: ["x-paystack-signature"]
};
app.use(helmet())
app.use(cors(corsConfigurationOptions))
app.use(cookiesParser())

// app.use("/api/subscribe-webhook", express.text({ type: "*/*" }), (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const rawTextPayload = req.body;
//     (req as any).rawBody = rawTextPayload; // 💡 Saves the exact string bytes for signature matching checks!

//     if (rawTextPayload && typeof rawTextPayload === "string" && rawTextPayload.trim().length > 0) {
//       // Manually parse the text string into a clean object layout
//       req.body = JSON.parse(rawTextPayload); 
//     } else {
//       req.body = {};
//     }
//     next();
//   } catch (error) {
//     console.log("❌ [Body Parser Error]: Manual JSON webhook string decoding failed.");
//     req.body = {};
//     next();
//   }
// });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter)
app.use('/api', productRouter)
app.use("/api/sales", saleRouter)
app.use("/api", reportRouter)
app.use("/api", subscriptionRouter)
app.use(globalErrorHandler)