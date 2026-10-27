import { Router } from "express";
import { z } from "zod";
import { getDb, persist } from "../../lib/db.js";
import { cache, invalidateCatalog } from "../../lib/cache.js";
import {
  availableOf,
  categoryDescendantIds,
  filterProducts,
  productAvailable,
  resolveCategory,
  toProductCard,
} from "../../lib/catalog.js";
import { hashQuery, newId, now, slugify } from "../../lib/ids.js";
import { toProductCard as _card } from "../../lib/catalog.js";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { badRequest, notFound } from "../../lib/errors.js";

export const productsRouter = Router();

productsRouter.get("/", (req, res) => {
  const query = {
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    category: typeof req.query.category === "string" ? req.query.category : undefined,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    rating: req.query.rating ? Number(req.query.rating) : undefined,
    brand: typeof req.query.brand === "string" ? req.query.brand : undefined,
    inStock: req.query.inStock === "true",
    sort: typeof req.query.sort === "string" ? req.query.sort : "popular",
    page: Math.max(1, Number(req.query.page ?? 1)),
    limit: Math.min(48, Math.max(1, Number(req.query.limit ?? 12))),
  };
  const cacheKey = `cache:list:${hashQuery(query)}`;
  const hit = cache.get<unknown>(cacheKey);
  if (hit) return res.json(hit);

  const { items, facets } = filterProducts(query);
  const total = items.length;
  const start = (query.page - 1) * query.limit;
  const pageItems = items.slice(start, start + query.limit).map(toProductCard);

  const category = query.category ? resolveCategory(query.category) : null;
  const siblings = category
    ? getDb()
        .categories.filter((c) => c.parentId === (category.parentId ?? category.id))
        .map((c) => ({ name: c.name, slug: c.slug }))
    : [];

  const payload = {
    data: pageItems,
    page: query.page,
    limit: query.limit,
    total,
    pages: Math.max(1, Math.ceil(total / query.limit)),
    facets,
    category: category ? { name: category.name, slug: category.slug, parentId: category.parentId ?? null } : null,
    siblings,
    appliedFilters: {
      q: query.q ?? null,
      category: query.category ?? null,
      minPrice: query.minPrice ?? null,
      maxPrice: query.maxPrice ?? null,
      rating: query.rating ?? null,
      brands: query.brand ? query.brand.split(",") : [],
      inStock: query.inStock,
      sort: query.sort,
    },
  };
  cache.set(cacheKey, payload, 120);
  res.json(payload);
});

productsRouter.get("/:slug", (req, res, next) => {
  try {
    const key = `cache:product:${req.params.slug}`;
    const hit = cache.get<Record<string, unknown>>(key);
    if (hit) return res.json(hit);

    const product = getDb().products.find(
      (p) => p.slug === req.params.slug && p.status !== "archived"
    );
    if (!product) throw notFound("That product could not be found");
    const category = getDb().categories.find((c) => c.id === product.categoryId);
    const categoryIds = category ? categoryDescendantIds(category.parentId ?? category.id) : [];
    const related = getDb()
      .products.filter(
        (p) =>
          p.id !== product.id &&
          p.status === "active" &&
          (categoryIds.includes(p.categoryId) || p.brand === product.brand)
      )
      .slice(0, 4)
      .map(toProductCard);

    const payload = {
      product: {
        ...product,
        compareAtPrice: product.compareAtPrice ?? null,
        availableStock: productAvailable(product),
        category: category ? { id: category.id, name: category.name, slug: category.slug, parentId: category.parentId ?? null } : null,
        variants: product.variants.map((v) => ({ ...v, available: availableOf(v) })),
      },
      related,
    };
    cache.set(key, payload, 600);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------- admin --- */

const variantSchema = z.object({
  sku: z.string().min(2).max(60),
  options: z.record(z.string()).default({}),
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
});

const productSchema = z.object({
  title: z.string().min(2).max(160),
  slug: z.string().max(160).optional(),
  description: z.string().min(10).max(8000),
  brand: z.string().min(1).max(80),
  categoryId: z.string().min(1),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().nullable().optional(),
  images: z.array(z.union([z.string(), z.object({ url: z.string(), alt: z.string().optional(), publicId: z.string().optional() })])).default([]),
  attributes: z.record(z.string()).default({}),
  variants: z.array(variantSchema).min(1),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  tags: z.array(z.string()).default([]),
});

productsRouter.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate(productSchema),
  (req, res, next) => {
    try {
      const db = getDb();
      const body = req.body as z.infer<typeof productSchema>;
      if (!db.categories.some((c) => c.id === body.categoryId)) throw badRequest("Choose a valid category");
      const baseSlug = slugify(body.slug || body.title);
      let slug = baseSlug;
      let i = 2;
      while (db.products.some((p) => p.slug === slug)) slug = `${baseSlug}-${i++}`;
      if (db.products.some((p) => p.variants.some((v) => body.variants.some((bv) => bv.sku === v.sku)))) {
        throw badRequest("One or more SKUs are already in use");
      }
      const product = {
        id: newId("prd"),
        title: body.title,
        slug,
        description: body.description,
        brand: body.brand,
        categoryId: body.categoryId,
        price: body.price,
        compareAtPrice: body.compareAtPrice ?? null,
        images: body.images.map((img, index) =>
          typeof img === "string"
            ? { url: img, alt: `${body.title} — view ${index + 1}` }
            : { url: img.url, alt: img.alt ?? `${body.title} — view ${index + 1}`, publicId: img.publicId }
        ),
        attributes: body.attributes,
        variants: body.variants.map((v) => ({
          sku: v.sku,
          options: v.options,
          price: v.price ?? body.price,
          stock: v.stock,
          reserved: 0,
          lowStockThreshold: v.lowStockThreshold,
        })),
        status: body.status,
        ratingAvg: 0,
        ratingCount: 0,
        sold: 0,
        tags: body.tags,
        createdAt: now(),
        updatedAt: now(),
      };
      db.products.unshift(product);
      invalidateCatalog();
      persist();
      res.status(201).json({ product });
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(productSchema.partial()),
  (req, res, next) => {
    try {
      const product = getDb().products.find((p) => p.id === req.params.id);
      if (!product) throw notFound("Product not found");
      const body = req.body as Partial<z.infer<typeof productSchema>>;
      if (body.categoryId && !getDb().categories.some((c) => c.id === body.categoryId)) {
        throw badRequest("Choose a valid category");
      }
      if (body.title !== undefined) product.title = body.title;
      if (body.slug !== undefined) product.slug = slugify(body.slug);
      if (body.description !== undefined) product.description = body.description;
      if (body.brand !== undefined) product.brand = body.brand;
      if (body.categoryId !== undefined) product.categoryId = body.categoryId;
      if (body.price !== undefined) product.price = body.price;
      if (body.compareAtPrice !== undefined) product.compareAtPrice = body.compareAtPrice;
      if (body.images !== undefined) {
        product.images = body.images.map((img, index) =>
          typeof img === "string"
            ? { url: img, alt: `${product.title} — view ${index + 1}` }
            : { url: img.url, alt: img.alt ?? `${product.title} — view ${index + 1}`, publicId: img.publicId }
        );
      }
      if (body.attributes !== undefined) product.attributes = body.attributes;
      if (body.tags !== undefined) product.tags = body.tags;
      if (body.status !== undefined) product.status = body.status;
      if (body.variants !== undefined) {
        product.variants = body.variants.map((v) => {
          const existing = product.variants.find((pv) => pv.sku === v.sku);
          return {
            sku: v.sku,
            options: v.options,
            price: v.price ?? product.price,
            stock: v.stock,
            reserved: existing?.reserved ?? 0,
            lowStockThreshold: v.lowStockThreshold,
          };
        });
      }
      product.updatedAt = now();
      invalidateCatalog();
      persist();
      res.json({ product });
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.delete("/:id", authenticate, requireRole("admin"), (req, res, next) => {
  try {
    const product = getDb().products.find((p) => p.id === req.params.id);
    if (!product) throw notFound("Product not found");
    product.status = "archived";
    product.updatedAt = now();
    invalidateCatalog();
    persist();
    res.json({ ok: true, archived: product.id });
  } catch (error) {
    next(error);
  }
});
