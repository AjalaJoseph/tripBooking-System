import CircuitBreaker from "opossum"
import { logger } from "../config/logger"

const breakerOptions: CircuitBreaker.Options = {
  timeout: 6000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5,
};

export const paystackBreaker = new CircuitBreaker(
  async <T>(apiAction: () => Promise<T>) => {
    return await apiAction();
  },
  breakerOptions
);

paystackBreaker.on("open", () => {
  logger.error(
    "🚨 [Paystack Circuit Breaker: OPEN] Paystack API appears unhealthy. Requests are temporarily blocked."
  );
});

paystackBreaker.on("halfOpen", () => {
  logger.info(
    "🟡 [Paystack Circuit Breaker: HALF_OPEN] Testing Paystack availability."
  );
});

paystackBreaker.on("close", () => {
  logger.info(
    "🟢 [Paystack Circuit Breaker: CLOSED] Paystack connection recovered."
  );
});

paystackBreaker.on("timeout", () => {
  logger.warn(
    "⏱️ [Paystack Circuit Breaker: TIMEOUT] Paystack request exceeded 6 seconds."
  );
});

export const runWithPaystackBreaker = async <T>(
  apiAction: () => Promise<T>
): Promise<T> => {
  const result = await paystackBreaker.fire(apiAction);
  return result as T;
};