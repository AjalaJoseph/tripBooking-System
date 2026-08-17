import { Router } from "express";
import { healthController } from "../controllers/healthController";
const healthRouter = Router()
healthRouter.get("/health", healthController);
export default healthRouter