import { Router } from "express";
import { z } from "zod";
import { getDb, persist } from "../../lib/db.js";
import { cache, invalidateCatalog } from "../../lib/cache.js";
import { categoryTree } from "../../lib/catalog.js";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { badRequest, notFound } from "../../lib/errors.js";
import { newId, now, slugify } from "../../lib/ids.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", asyncHandler(async (_req, res) => {
  const hit = await cache.get<unknown>("cache:categories");
  if (hit) return res.json(hit);
  const tree = categoryTree();
  const payload = { data: tree };
  await cache.set("cache:categories", payload, 3600);
  res.json(payload);
}));

const categorySchema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().max(60).optional(),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

categoriesRouter.post("/", authenticate, requireRole("admin"), validate(categorySchema), (req, res, next) => {
  try {
    const db = getDb();
    const body = req.body as z.infer<typeof categorySchema>;
    const base = slugify(body.slug || body.name);
    if (db.categories.some((c) => c.slug === base)) throw badRequest("That category slug is already in use");
    if (body.parentId && !db.categories.some((c) => c.id === body.parentId)) {
      throw badRequest("Parent category not found");
    }
    const category = {
      id: newId("cat"),
      name: body.name,
      slug: base,
      parentId: body.parentId ?? null,
      imageUrl: body.imageUrl,
      sortOrder: body.sortOrder,
    };
    db.categories.push(category);
    invalidateCatalog();
    persist();
    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
});

categoriesRouter.patch("/:id", authenticate, requireRole("admin"), validate(categorySchema.partial()), (req, res, next) => {
  try {
    const db = getDb();
    const category = db.categories.find((c) => c.id === req.params.id);
    if (!category) throw notFound("Category not found");
    const body = req.body as Partial<z.infer<typeof categorySchema>>;
    if (body.slug) category.slug = slugify(body.slug);
    if (body.name) category.name = body.name;
    if (body.parentId !== undefined) {
      if (body.parentId === category.id) throw badRequest("A category cannot be its own parent");
      category.parentId = body.parentId ?? null;
    }
    if (body.imageUrl !== undefined) category.imageUrl = body.imageUrl;
    if (body.sortOrder !== undefined) category.sortOrder = body.sortOrder;
    invalidateCatalog();
    persist();
    res.json({ category });
  } catch (error) {
    next(error);
  }
});

categoriesRouter.delete("/:id", authenticate, requireRole("admin"), (req, res, next) => {
  try {
    const db = getDb();
    const category = db.categories.find((c) => c.id === req.params.id);
    if (!category) throw notFound("Category not found");
    if (db.categories.some((c) => c.parentId === category.id)) {
      throw badRequest("Move or delete child categories first");
    }
    if (db.products.some((p) => p.categoryId === category.id)) {
      throw badRequest("Move products out of this category first");
    }
    db.categories = db.categories.filter((c) => c.id !== category.id);
    invalidateCatalog();
    persist();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
