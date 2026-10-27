import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { env } from "../config/env.js";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.originalUrl}`, details: [] },
  });
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details },
    });
  }
  console.error(`[error] ${req.method} ${req.originalUrl}`, error);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message:
        env.nodeEnv === "production"
          ? "Something went wrong on our side. Please try again."
          : error instanceof Error
            ? error.message
            : "Unknown error",
      details: [],
    },
  });
}
