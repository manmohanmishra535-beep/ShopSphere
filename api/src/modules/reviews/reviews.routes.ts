import { Router } from "express";
import { z } from "zod";
import { getDb, persist } from "../../lib/db.js";
import { authenticate, optionalAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { badRequest, conflict, forbidden, notFound } from "../../lib/errors.js";
import { newId, now } from "../../lib/ids.js";
import { invalidateCatalog } from "../../lib/cache.js";
import type { Product, Review } from "../../types.js";

export const reviewsRouter = Router({ mergeParams: true });

function resolveProduct(idOrSlug: string) {
  return getDb().products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

function recalcProduct(product: Product) {
  const published = getDb().reviews.filter(
    (r) => r.productId === product.id && r.status === "published"
  );
  product.ratingCount = published.length;
  product.ratingAvg = published.length
    ? Math.round((published.reduce((sum, r) => sum + r.rating, 0) / published.length) * 10) / 10
    : 0;
  invalidateCatalog();
}

function toPublicReview(review: Review) {
  const user = getDb().users.find((u) => u.id === review.userId);
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    images: review.images,
    helpful: review.helpful,
    reply: review.reply,
    createdAt: review.createdAt,
    author: user ? user.name : "ShopSphere customer",
    verified: true,
  };
}

reviewsRouter.get("/", optionalAuth, (req, res, next) => {
  try {
    const product = resolveProduct(String(req.params.productId));
    if (!product) throw notFound("Product not found");
    const sort = String(req.query.sort ?? "recent");
    const published = getDb()
      .reviews.filter((r) => r.productId === product.id && r.status === "published")
      .sort((a, b) => {
        if (sort === "highest") return b.rating - a.rating;
        if (sort === "lowest") return a.rating - b.rating;
        if (sort === "helpful") return b.helpful - a.helpful;
        return a.createdAt < b.createdAt ? 1 : -1;
      });

    const histogram = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: published.filter((r) => r.rating === star).length,
    }));
    const avg = published.length
      ? Math.round((published.reduce((sum, r) => sum + r.rating, 0) / published.length) * 10) / 10
      : 0;

    let canReview = false;
    let myReview: Review | undefined;
    if (req.user) {
      myReview = getDb().reviews.find((r) => r.productId === product.id && r.userId === req.user!.id);
      canReview =
        !myReview &&
        getDb().orders.some(
          (o) =>
            o.userId === req.user!.id &&
            o.status === "delivered" &&
            o.items.some((item) => item.productId === product.id)
        );
    }

    res.json({
      data: published.map(toPublicReview),
      summary: { avg, count: published.length, histogram, ratingAvg: product.ratingAvg, ratingCount: product.ratingCount },
      canReview,
      myReview: myReview
        ? {
            ...myReview,
            productTitle: product.title,
            status: myReview.status,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3, "Add a short title").max(100),
  body: z.string().min(10, "Tell us a little more").max(1500),
  images: z.array(z.string().url()).max(3).default([]),
});

reviewsRouter.post("/", authenticate, validate(reviewSchema), (req, res, next) => {
  try {
    const product = resolveProduct(String(req.params.productId));
    if (!product) throw notFound("Product not found");
    const user = req.user!;
    const deliveredOrder = getDb().orders.find(
      (o) =>
        o.userId === user.id &&
        o.status === "delivered" &&
        o.items.some((item) => item.productId === product.id)
    );
    if (!deliveredOrder) {
      throw forbidden("Only customers with a delivered order can review this product");
    }
    if (getDb().reviews.some((r) => r.productId === product.id && r.userId === user.id)) {
      throw conflict("ALREADY_REVIEWED", "You have already reviewed this product");
    }
    const review: Review = {
      id: newId("rev"),
      productId: product.id,
      userId: user.id,
      orderId: deliveredOrder.id,
      rating: req.body.rating,
      title: req.body.title,
      body: req.body.body,
      images: req.body.images,
      status: "pending",
      helpful: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    getDb().reviews.push(review);
    persist();
    res.status(201).json({ review: toPublicReview(review), status: "pending" });
  } catch (error) {
    next(error);
  }
});

reviewsRouter.post("/:id/helpful", (req, res, next) => {
  try {
    const review = getDb().reviews.find((r) => r.id === req.params.id);
    if (!review) throw notFound("Review not found");
    review.helpful += 1;
    persist();
    res.json({ helpful: review.helpful });
  } catch (error) {
    next(error);
  }
});

const moderateSchema = z.object({
  status: z.enum(["published", "hidden", "pending"]).optional(),
  reply: z.string().max(1000).optional(),
});

reviewsRouter.patch("/:id", authenticate, requireRole("admin"), validate(moderateSchema), (req, res, next) => {
  try {
    const review = getDb().reviews.find((r) => r.id === req.params.id);
    if (!review) throw notFound("Review not found");
    if (req.body.status) review.status = req.body.status;
    if (req.body.reply !== undefined) review.reply = req.body.reply;
    review.updatedAt = now();
    const product = getDb().products.find((p) => p.id === review.productId);
    if (product) recalcProduct(product);
    persist();
    res.json({ review });
  } catch (error) {
    next(error);
  }
});
