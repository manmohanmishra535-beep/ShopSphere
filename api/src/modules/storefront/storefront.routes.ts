import { Router } from "express";
import { getDb } from "../../lib/db.js";
import { categoryTree, filterProducts, toProductCard } from "../../lib/catalog.js";
import { cache } from "../../lib/cache.js";
import { hashQuery } from "../../lib/ids.js";

export const storefrontRouter = Router();

storefrontRouter.get("/home", (_req, res) => {
  const key = "cache:list:storefront-home";
  const hit = cache.get<unknown>(key);
  if (hit) return res.json(hit);

  const active = getDb().products.filter((p) => p.status === "active");
  const byNewest = [...active].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const byPopular = [...active].sort((a, b) => b.sold - a.sold);
  const sale = active.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);

  const payload = {
    hero: byNewest.find((p) => p.slug === "cashmere-cardigan") ?? active[0],
    newArrivals: byNewest.slice(0, 8).map(toProductCard),
    bestSellers: byPopular.slice(0, 8).map(toProductCard),
    editorsPicks: sale.slice(0, 4).map(toProductCard),
    categories: categoryTree(),
    stats: {
      products: active.length,
      happyCustomers: Math.max(1200, active.reduce((sum, p) => sum + p.sold, 0) * 4),
    },
  };
  cache.set(key, payload, 120);
  res.json(payload);
});

storefrontRouter.get("/suggest", (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) return res.json({ products: [], categories: [] });
  const key = `cache:suggest:${hashQuery(q.toLowerCase())}`;
  const hit = cache.get<unknown>(key);
  if (hit) return res.json(hit);

  const { items } = filterProducts({ q, sort: "popular" });
  const products = items.slice(0, 6).map((p) => {
    const card = toProductCard(p);
    return { id: card.id, title: card.title, slug: card.slug, price: card.price, image: card.image, brand: card.brand };
  });
  const needle = q.toLowerCase();
  const categories = getDb()
    .categories.filter((c) => c.name.toLowerCase().includes(needle))
    .slice(0, 3)
    .map((c) => ({ name: c.name, slug: c.slug }));
  const payload = { products, categories };
  cache.set(key, payload, 60);
  res.json(payload);
});
