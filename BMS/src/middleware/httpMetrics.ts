import { Request, Response, NextFunction } from "express";
import { httpRequestCounter, httpRequestDuration } from "../monitoring/metrics";

export const httpMetrics = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();
  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const durationInSeconds = Number(endTime - startTime) / 1_000_000_000;

    const route =req.route?.path? `${req.baseUrl}${req.route.path}` : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    };

    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(
      labels,
      durationInSeconds
    );
  });

  next();
};