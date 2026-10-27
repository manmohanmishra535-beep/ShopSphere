import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import { env } from "./config/env.js";
import { getDb } from "./lib/db.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { storefrontRouter } from "./modules/storefront/storefront.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";
import { categoriesRouter } from "./modules/categories/categories.routes.js";
import { cartRouter } from "./modules/cart/cart.routes.js";
import { wishlistRouter } from "./modules/wishlist/wishlist.routes.js";
import { addressesRouter } from "./modules/addresses/addresses.routes.js";
import { checkoutRouter, paymentsRouter, webhooksRouter } from "./modules/checkout/checkout.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { reviewsRouter } from "./modules/reviews/reviews.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { mediaRouter } from "./modules/media/media.routes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    const requestId = req.headers["x-request-id"] ?? crypto.randomUUID();
    res.setHeader("X-Request-Id", String(requestId));
    const started = Date.now();
    res.on("finish", () => {
      if (req.path === "/health") return;
      console.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`
      );
    });
    next();
  });

  app.use(
    cors({
      origin: [env.webOrigin, "http://127.0.0.1:3000"],
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(rateLimit({ limit: 600, windowSeconds: 60, key: "global" }));

  app.get("/health", (_req, res) => {
    const db = getDb();
    res.json({
      status: "ok",
      version: "1.0.0",
      uptime: Math.round(process.uptime()),
      data: { products: db.products.length, orders: db.orders.length, users: db.users.length },
      time: new Date().toISOString(),
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/storefront", storefrontRouter);
  app.use("/api/v1/categories", categoriesRouter);
  app.use("/api/v1/products/:productId/reviews", reviewsRouter);
  app.use("/api/v1/products", productsRouter);
  app.use("/api/v1/reviews", reviewsRouter);
  app.use("/api/v1/cart", cartRouter);
  app.use("/api/v1/wishlist", wishlistRouter);
  app.use("/api/v1/me/addresses", addressesRouter);
  app.use("/api/v1/checkout", rateLimit({ limit: 60, windowSeconds: 60, key: "checkout" }), checkoutRouter);
  app.use("/api/v1/payments", paymentsRouter);
  app.use("/api/v1/webhooks", webhooksRouter);
  app.use("/api/v1/orders", ordersRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/media", mediaRouter);

  app.get("/api/v1", (_req, res) => {
    res.json({
      name: "ShopSphere API",
      version: "1.0.0",
      docs: "/api/v1",
      endpoints: [
        "GET /products",
        "GET /products/:slug",
        "GET /storefront/home",
        "GET /categories",
        "GET/PUT/DELETE /cart",
        "GET /orders",
        "GET /admin/stats",
      ],
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
