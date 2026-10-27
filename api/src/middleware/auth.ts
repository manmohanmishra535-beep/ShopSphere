import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { getDb } from "../lib/db.js";
import { verifyToken } from "../lib/auth.js";
import { forbidden, unauthorized } from "../lib/errors.js";
import type { User } from "../types.js";

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  const cookie = req.cookies?.[env.cookieName];
  return typeof cookie === "string" && cookie.length > 0 ? cookie : null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) return next(unauthorized());
  const payload = verifyToken(token);
  if (!payload) return next(unauthorized("Your session has expired. Please sign in again."));
  const user = getDb().users.find((u) => u.id === payload.sub);
  if (!user) return next(unauthorized("Account no longer exists"));
  req.user = user;
  return next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const user = getDb().users.find((u) => u.id === payload.sub);
      if (user) req.user = user;
    }
  }
  return next();
}

export function requireRole(role: User["role"]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (req.user.role !== role) return next(forbidden("Admin access only"));
    return next();
  };
}
