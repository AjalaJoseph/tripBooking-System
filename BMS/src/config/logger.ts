import { createLogger, format, transports } from 'winston';
import Transport, { TransportStreamOptions } from 'winston-transport';
import * as Sentry from '@sentry/node';
import dotenv from "dotenv";

dotenv.config();
const { combine, timestamp, json, colorize, simple } = format;

// 1. 🚀 INITIALIZE SENTRY
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: "bizflow-backend@1.0.0", 
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: false
  });
}

/**
 * High-Utility Log Sanitizer Formatter.
 * Recursively scans log info metadata attributes to redact passwords, secrets, and tokens.
 */
const sanitizeSecrets = format((info) => {
  const redact = (obj: any): void => {
    if (!obj || typeof obj !== 'object') return;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          redact(obj[key]);
        } else if (
          key.toLowerCase().includes('password') || 
          key.toLowerCase() === 'token' ||
          key.toLowerCase().includes('secret')
        ) {
          obj[key] = '[REDACTED]';
        }
      }
    }
  };

  // Clone payload attributes to prevent unintended data-mutation freezing during request lifecycles
  if (info.body && typeof info.body === 'object') {
    info.body = JSON.parse(JSON.stringify(info.body));
    redact(info.body);
  }
  if (info.params && typeof info.params === 'object') {
    info.params = JSON.parse(JSON.stringify(info.params));
    redact(info.params);
  }
  if (info.query && typeof info.query === 'object') {
    info.query = JSON.parse(JSON.stringify(info.query));
    redact(info.query);
  }

  return info;
});

/**
 * Custom Type-Safe Winston-to-Sentry Pipeline.
 * Pipes error logs directly up onto your cloud telemetry overview grids automatically.
 */
class SentryTransport extends Transport {
  constructor(opts: TransportStreamOptions) {
    super(opts);
    this.level = opts.level || 'error'; 
  }

  public override log(info: any, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    // Pipe error aggregates directly up onto your external cloud telemetry grids
    if (info.level === 'error') {
      const errorObject = info.error instanceof Error ? info.error : new Error(info.message);
      
      Sentry.captureException(errorObject, {
        extra: {
          timestamp: info.timestamp,
          body: info.body || null,
          params: info.params || null,
          query: info.query || null,
          meta: info.meta || null
        }
      });
    }
    callback();
  }
}

// 2. CORE MASTER LOGGER ENGINE ENGINE ASSEMBLY
export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    sanitizeSecrets(), // Runs first: Secures your local logs and Sentry alerts before files write!
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
    
    // Integrated Sentry custom transport pipeline module
    new SentryTransport({ level: 'error' })
  ],
});

// 3. DEVELOPMENT LOGGING EXTENSION CONSOLE
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      simple()
    )
  }));
}
