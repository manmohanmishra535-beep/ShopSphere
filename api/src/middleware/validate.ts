import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { badRequest } from "../lib/errors.js";

export function validate<T extends ZodTypeAny>(schema: T, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      if (source === "body") req.body = parsed;
      else (req as unknown as Record<string, unknown>)[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          badRequest(
            "Please check the highlighted fields",
            error.errors.map((e) => ({ path: e.path.join("."), message: e.message }))
          )
        );
      } else next(error);
    }
  };
}
