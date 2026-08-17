import { Router } from "express";
import { metricsController } from "../controllers/monitoringController";

const metricsRoute= Router();

metricsRoute.get("/metrics", metricsController);

export default metricsRoute;