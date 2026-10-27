import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import type { User } from "../types.js";

export interface TokenPayload {
  sub: string;
  role: User["role"];
}

export function signToken(user: User): string {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash?: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export function publicUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}
