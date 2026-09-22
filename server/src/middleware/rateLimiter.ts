import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitRecord>();

/**
 * Simple in-memory rate limiter (no external dependency).
 * Resets per IP per window.
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '');
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    const record = store.get(key);
    if (!record || now - record.windowStart > windowMs) {
      store.set(key, { count: 1, windowStart: now });
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((windowMs - (now - record.windowStart)) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: `Too many requests. Please retry after ${retryAfter} seconds.`,
          retryAfter
        }
      });
    }

    return next();
  };
}

// Clean up stale entries every 5 minutes to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now - record.windowStart > 5 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);
