import client from "prom-client";

// client.collectDefaultMetrics()
// Total HTTP requests
// console.log("📊 Metrics module loaded");
export const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

// HTTP request duration
// console.log("📊 Counter created");
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

export const tokenRotationCounter = new client.Counter({
  name: "pos_token_rotation_total",
  help: "Total aggregate count of token rotation event executions.",
  labelNames: ["status", "breach_detected"], // Explicit metadata filtering flags for Grafana Cloud [S4]
});

export const salesTransactionCounter = new client.Counter({
  name: "pos_sales_transactions_total",
  help: "Total number of checkout payment transactions attempted.",
  labelNames: ["payment_method", "status"],
});
// console.log("📊 Histogram created");
export const register = client.register;