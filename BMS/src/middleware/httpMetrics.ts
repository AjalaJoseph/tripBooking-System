import { Request, Response, NextFunction } from "express";
import { httpRequestCounter, httpRequestDuration } from "../monitoring/metrics";

const normalizeRoutePath = (req: Request): string => {
  // Option A: If Express has already matched the route path natively, use its pre-built mask [S4]
  if (req.route?.path) {
    return `${req.baseUrl}${req.route.path}`;
  }

  // Option B: Fallback regex cleaner for unmatched endpoints, 404 paths, or static media assets
  let pathString = req.baseUrl + req.path;

  // 1. Mask standard 36-character hexadecimal UUID format strings (e.g., /sales/uuid -> /sales/:id) [S4]
  const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
  pathString = pathString.replace(uuidRegex, ":id");

  // 2. Mask absolute numbers or incremental digit indices (e.g., /products/42 -> /products/:id) [S4]
  pathString = pathString.replace(/\/\d+/g, "/:id");

  return pathString || "/";
};


export const httpMetrics = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();
  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const durationInSeconds = Number(endTime - startTime) / 1_000_000_000;

    const cleanRouteLabel = normalizeRoutePath(req);
    const telemetryLabels = {
      method: req.method,
      route: cleanRouteLabel,
      status_code: res.statusCode.toString(),
    };

    httpRequestCounter.inc(telemetryLabels);
    httpRequestDuration.observe(telemetryLabels, durationInSeconds);
  });

  next();
};