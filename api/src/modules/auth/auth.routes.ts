import { Router } from "express";
import { z } from "zod";
import { getDb, persist } from "../../lib/db.js";
import { comparePassword, hashPassword, publicUser, signToken } from "../../lib/auth.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { conflict, unauthorized } from "../../lib/errors.js";
import { env, isProd } from "../../config/env.js";
import { newId, now } from "../../lib/ids.js";
import { rateLimit } from "../../middleware/rateLimit.js";

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerSchema = z.object({
  name: z.string().min(2, "Please enter your full name").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Use at least 6 characters"),
  phone: z.string().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

authRouter.post("/register", rateLimit({ limit: 20, windowSeconds: 60 }), validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const db = getDb();
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw conflict("EMAIL_IN_USE", "An account with this email already exists");
    }
    const user = {
      id: newId("usr"),
      name,
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      role: "customer" as const,
      phone,
      addresses: [],
      createdAt: now(),
    };
    db.users.push(user);
    persist();
    const token = signToken(user);
    res.cookie(env.cookieName, token, cookieOptions);
    res.status(201).json({ user: publicUser(user), token });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", rateLimit({ limit: 20, windowSeconds: 60 }), validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = getDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw unauthorized("Email or password is incorrect");
    }
    const token = signToken(user);
    res.cookie(env.cookieName, token, cookieOptions);
    res.json({ user: publicUser(user), token });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(env.cookieName, { path: "/" });
  res.json({ ok: true });
});

authRouter.get("/me", authenticate, (req, res) => {
  res.json({ user: publicUser(req.user!) });
});

authRouter.patch(
  "/me",
  authenticate,
  validate(z.object({ name: z.string().min(2).max(80).optional(), phone: z.string().max(20).optional() })),
  (req, res) => {
    const user = req.user!;
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    persist();
    res.json({ user: publicUser(user) });
  }
);
