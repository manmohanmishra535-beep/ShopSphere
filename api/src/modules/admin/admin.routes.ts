import { Router } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { getDb, persist } from "../../lib/db.js";
import { availableOf, productAvailable } from "../../lib/catalog.js";
import { badRequest, notFound } from "../../lib/errors.js";
import { newId, now } from "../../lib/ids.js";
import { invalidateCatalog } from "../../lib/cache.js";
import type { OrderStatus } from "../../types.js";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole("admin"));

const REVENUE_STATUSES: OrderStatus[] = ["paid", "packed", "shipped", "delivered"];
const isRevenue = (status: OrderStatus) => REVENUE_STATUSES.includes(status);

adminRouter.get("/stats", (req, res) => {
  const db = getDb();
  const days = Math.min(90, Math.max(7, Number(req.query.days ?? 30)));
  const nowMs = Date.now();
  const periodMs = days * 86400000;
  const currentStart = nowMs - periodMs;
  const previousStart = currentStart - periodMs;

  const revenueOrders = db.orders.filter((o) => isRevenue(o.status));
  const current = revenueOrders.filter((o) => new Date(o.createdAt).getTime() >= currentStart);
  const previous = revenueOrders.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t >= previousStart && t < currentStart;
  });

  const sum = (orders: typeof current) => orders.reduce((total, o) => total + o.total, 0);
  const revenue = sum(current);
  const prevRevenue = sum(previous);
  const ordersCount = current.length;
  const prevOrders = previous.length;
  const aov = ordersCount ? Math.round(revenue / ordersCount) : 0;
  const prevAov = prevOrders ? Math.round(prevRevenue / prevOrders) : 0;
  const newCustomers = db.users.filter(
    (u) => u.role === "customer" && new Date(u.createdAt).getTime() >= currentStart
  ).length;
  const prevCustomers = db.users.filter((u) => {
    const t = new Date(u.createdAt).getTime();
    return u.role === "customer" && t >= previousStart && t < currentStart;
  }).length;

  const change = (value: number, prev: number) =>
    prev === 0 ? (value === 0 ? 0 : 100) : Math.round(((value - prev) / prev) * 100);

  const revenueByDay: { date: string; label: string; revenue: number; orders: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(nowMs - i * 86400000);
    const dateKey = day.toISOString().slice(0, 10);
    const dayOrders = current.filter((o) => o.createdAt.slice(0, 10) === dateKey);
    revenueByDay.push({
      date: dateKey,
      label: day.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      revenue: dayOrders.reduce((total, o) => total + o.total, 0),
      orders: dayOrders.length,
    });
  }

  const unitsByProduct = new Map<string, { productId: string; units: number; revenue: number }>();
  for (const order of current) {
    for (const item of order.items) {
      const entry = unitsByProduct.get(item.productId) ?? {
        productId: item.productId,
        units: 0,
        revenue: 0,
      };
      entry.units += item.qty;
      entry.revenue += item.qty * item.price;
      unitsByProduct.set(item.productId, entry);
    }
  }
  const topProducts = [...unitsByProduct.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, 5)
    .map((entry) => {
      const product = db.products.find((p) => p.id === entry.productId);
      return {
        ...entry,
        title: product?.title ?? "Deleted product",
        image: product?.images[0]?.url ?? "",
        slug: product?.slug ?? "",
      };
    });

  const lowStock = db.products
    .filter((p) => p.status === "active")
    .flatMap((product) =>
      product.variants
        .filter((v) => availableOf(v) <= v.lowStockThreshold)
        .map((v) => ({
          sku: v.sku,
          productId: product.id,
          title: product.title,
          image: product.images[0]?.url ?? "",
          options: v.options,
          available: availableOf(v),
          threshold: v.lowStockThreshold,
          out: availableOf(v) === 0,
        }))
    )
    .sort((a, b) => a.available - b.available)
    .slice(0, 8);

  const latestOrders = [...db.orders]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6)
    .map((order) => {
      const customer = db.users.find((u) => u.id === order.userId);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentStatus: order.payment.status,
        createdAt: order.createdAt,
        customerName: customer?.name ?? "Guest",
      };
    });

  res.json({
    range: days,
    kpis: {
      revenue: { value: revenue, change: change(revenue, prevRevenue) },
      orders: { value: ordersCount, change: change(ordersCount, prevOrders) },
      aov: { value: aov, change: change(aov, prevAov) },
      newCustomers: { value: newCustomers, change: change(newCustomers, prevCustomers) },
    },
    revenueByDay,
    topProducts,
    lowStock,
    latestOrders,
    counts: {
      toPack: db.orders.filter((o) => o.status === "paid").length,
      pendingReviews: db.reviews.filter((r) => r.status === "pending").length,
      lowStock: lowStock.filter((l) => !l.out).length,
      outOfStock: lowStock.filter((l) => l.out).length,
      products: db.products.filter((p) => p.status === "active").length,
      customers: db.users.filter((u) => u.role === "customer").length,
    },
  });
});

adminRouter.get("/products", (req, res) => {
  const db = getDb();
  const q = typeof req.query.q === "string" ? req.query.q.toLowerCase() : "";
  const status = typeof req.query.status === "string" && req.query.status !== "all" ? req.query.status : null;
  const products = db.products
    .filter((p) => (status ? p.status === status : true))
    .filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(q))
    )
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .map((product) => {
      const category = db.categories.find((c) => c.id === product.categoryId);
      return {
        ...product,
        availableStock: productAvailable(product),
        onHand: product.variants.reduce((sum, v) => sum + v.stock, 0),
        reserved: product.variants.reduce((sum, v) => sum + v.reserved, 0),
        category: category
          ? { id: category.id, name: category.name, slug: category.slug, parentId: category.parentId ?? null }
          : null,
      };
    });

  res.json({
    data: products,
    total: products.length,
    counts: {
      all: db.products.length,
      active: db.products.filter((p) => p.status === "active").length,
      draft: db.products.filter((p) => p.status === "draft").length,
      archived: db.products.filter((p) => p.status === "archived").length,
    },
  });
});

adminRouter.get("/products/:id", (req, res, next) => {
  try {
    const db = getDb();
    const product = db.products.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!product) throw notFound("Product not found");
    const category = db.categories.find((c) => c.id === product.categoryId);
    res.json({
      product: {
        ...product,
        availableStock: productAvailable(product),
        category: category
          ? { id: category.id, name: category.name, slug: category.slug, parentId: category.parentId ?? null }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/inventory", (req, res) => {
  const db = getDb();
  const filter = String(req.query.filter ?? "all");
  const q = typeof req.query.q === "string" ? req.query.q.toLowerCase() : "";
  const rows = db.products
    .filter((p) => p.status !== "archived")
    .flatMap((product) =>
      product.variants.map((variant) => {
        const available = availableOf(variant);
        return {
          sku: variant.sku,
          productId: product.id,
          productTitle: product.title,
          productSlug: product.slug,
          image: product.images[0]?.url ?? "",
          status: product.status,
          options: variant.options,
          onHand: variant.stock,
          reserved: variant.reserved,
          available,
          lowStockThreshold: variant.lowStockThreshold,
          low: available > 0 && available <= variant.lowStockThreshold,
          out: available === 0,
          updatedAt: product.updatedAt,
        };
      })
    )
    .filter((row) => {
      if (filter === "low") return row.low;
      if (filter === "out") return row.out;
      return true;
    })
    .filter((row) =>
      !q ||
      row.sku.toLowerCase().includes(q) ||
      row.productTitle.toLowerCase().includes(q)
    )
    .sort((a, b) => a.productTitle.localeCompare(b.productTitle) || a.sku.localeCompare(b.sku));

  const allRows = db.products
    .filter((p) => p.status !== "archived")
    .flatMap((p) => p.variants.map((v) => availableOf(v)));
  res.json({
    data: rows,
    counts: {
      all: allRows.length,
      low: allRows.filter((a) => a > 0 && a <= 5).length,
      out: allRows.filter((a) => a === 0).length,
    },
  });
});

const stockSchema = z.object({
  mode: z.enum(["add", "remove", "set"]),
  quantity: z.number().int().min(0).max(100000),
  reason: z.enum(["restock", "damage", "correction"]),
  note: z.string().max(200).optional(),
});

adminRouter.patch("/inventory/:sku", validate(stockSchema), (req, res, next) => {
  try {
    const db = getDb();
    let target: { productId: string; variant: (typeof db.products)[number]["variants"][number] } | null = null;
    for (const product of db.products) {
      const variant = product.variants.find((v) => v.sku === req.params.sku);
      if (variant) {
        target = { productId: product.id, variant };
        break;
      }
    }
    if (!target) throw notFound("SKU not found");
    const { mode, quantity, reason, note } = req.body;
    const variant = target.variant;
    let delta = 0;
    if (mode === "add") delta = quantity;
    else if (mode === "remove") delta = -quantity;
    else delta = quantity - variant.stock;

    if (delta === 0) return res.json({ sku: variant.sku, stock: variant.stock, delta: 0 });
    const nextStock = variant.stock + delta;
    if (nextStock < 0) throw badRequest("Stock cannot go below zero");
    if (nextStock < variant.reserved) {
      throw badRequest(`Stock cannot go below the ${variant.reserved} units currently reserved`);
    }
    variant.stock = nextStock;
    db.stockMovements.unshift({
      id: newId("mov"),
      sku: variant.sku,
      delta,
      reason,
      note,
      actor: req.user!.email,
      at: now(),
    });
    invalidateCatalog();
    persist();
    res.json({
      sku: variant.sku,
      onHand: variant.stock,
      reserved: variant.reserved,
      available: availableOf(variant),
      delta,
      history: db.stockMovements.filter((m) => m.sku === variant.sku).slice(0, 8),
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/inventory/:sku/history", (req, res, next) => {
  try {
    const movements = getDb().stockMovements.filter((m) => m.sku === req.params.sku);
    if (movements.length === 0) {
      const exists = getDb().products.some((p) => p.variants.some((v) => v.sku === req.params.sku));
      if (!exists) throw notFound("SKU not found");
    }
    res.json({ data: movements.slice(0, 30) });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/users", (req, res) => {
  const db = getDb();
  const q = typeof req.query.q === "string" ? req.query.q.toLowerCase() : "";
  const role = typeof req.query.role === "string" && req.query.role !== "all" ? req.query.role : null;
  const users = db.users
    .filter((u) => (role ? u.role === role : true))
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .map((user) => {
      const orders = db.orders.filter((o) => o.userId === user.id && isRevenue(o.status));
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        orderCount: orders.length,
        totalSpend: orders.reduce((sum, o) => sum + o.total, 0),
        addressCity: user.addresses[0]?.city ?? null,
        lastOrderAt: orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0]?.createdAt ?? null,
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend);
  res.json({ data: users, total: users.length });
});

const roleSchema = z.object({ role: z.enum(["customer", "admin"]) });

adminRouter.patch("/users/:id", validate(roleSchema), (req, res, next) => {
  try {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) throw notFound("User not found");
    if (user.id === req.user!.id && req.body.role !== "admin") {
      throw badRequest("You cannot remove your own admin access");
    }
    if (user.role === "admin" && req.body.role === "customer") {
      const admins = db.users.filter((u) => u.role === "admin");
      if (admins.length <= 1) throw badRequest("The store needs at least one admin");
    }
    user.role = req.body.role;
    db.auditLogs.unshift({
      id: newId("aud"),
      action: "role_change",
      actor: req.user!.email,
      target: user.email,
      at: now(),
      meta: { role: req.body.role },
    });
    persist();
    res.json({ user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/reviews", (req, res) => {
  const db = getDb();
  const status = typeof req.query.status === "string" && req.query.status !== "all" ? req.query.status : null;
  const reviews = db.reviews
    .filter((r) => (status ? r.status === status : true))
    .map((review) => {
      const product = db.products.find((p) => p.id === review.productId);
      const user = db.users.find((u) => u.id === review.userId);
      const order = db.orders.find((o) => o.id === review.orderId);
      return {
        ...review,
        productTitle: product?.title ?? "Deleted product",
        productSlug: product?.slug ?? "",
        productImage: product?.images[0]?.url ?? "",
        author: user?.name ?? "Customer",
        authorEmail: user?.email ?? "",
        orderNumber: order?.orderNumber ?? "",
      };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json({
    data: reviews,
    counts: {
      all: db.reviews.length,
      pending: db.reviews.filter((r) => r.status === "pending").length,
      published: db.reviews.filter((r) => r.status === "published").length,
      hidden: db.reviews.filter((r) => r.status === "hidden").length,
    },
  });
});

adminRouter.get("/settings", (_req, res) => {
  res.json({ settings: getDb().settings });
});

const settingsSchema = z.object({
  storeName: z.string().min(2).max(80).optional(),
  supportEmail: z.string().email().optional(),
  shippingFee: z.number().int().min(0).optional(),
  freeShippingThreshold: z.number().int().min(0).optional(),
  expressFee: z.number().int().min(0).optional(),
  taxRatePercent: z.number().min(0).max(28).optional(),
  lowStockEmail: z.boolean().optional(),
  orderEmail: z.boolean().optional(),
});

adminRouter.patch("/settings", validate(settingsSchema), (req, res) => {
  Object.assign(getDb().settings, req.body);
  persist();
  res.json({ settings: getDb().settings });
});

adminRouter.get("/audit-logs", (_req, res) => {
  res.json({ data: getDb().auditLogs.slice(0, 50) });
});
