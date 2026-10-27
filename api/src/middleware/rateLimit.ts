import type { NextFunction, Request, Response } from "express";
import { cache } from "../lib/cache.js";
import { AppError } from "../lib/errors.js";

export function rateLimit(options: { limit: number; windowSeconds: number; key?: string }) {
  const { limit, windowSeconds, key } = options;
  return (req: Request, res: Response, next: NextFunction) => {
    const identity = req.user?.id ?? req.ip ?? "anon";
    const routeKey = `rl:${identity}:${key ?? req.baseUrl + req.path}`;
    const hits = cache.increment(routeKey, windowSeconds);
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - hits));
    if (hits > limit) {
      return next(
        new AppError(429, "RATE_LIMITED", "Too many requests. Please wait a moment and try again.")
      );
    }
    next();
  };
}
