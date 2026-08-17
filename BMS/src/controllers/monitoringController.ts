import { Request, Response } from "express";
import { register } from "../monitoring/metrics";
import { logger } from "../config/logger";

export const metricsController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.set("Content-Type", register.contentType);

    const metrics = await register.metrics();

    res.status(200).send(metrics);
  } catch (error) {
    logger.error("Metrics endpoint error:", error);

    res.status(500).json({
      status: "fail",
      message: "Unable to collect system metrics.",
    });
  }
};