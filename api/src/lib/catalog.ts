import { getDb } from "./db.js";
import { productColours } from "./colors.js";
import type { Cart, Category, Product, Variant } from "../types.js";

export interface ProductCard {
  id: string;
  title: string;
  slug: string;
  brand: string;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  image: string;
  hoverImage: string;
  ratingAvg: number;
  ratingCount: number;
  availableStock: number;
  inStock: boolean;
  badge: "new" | "sale" | "bestseller" | null;
  colors: { name: string; hex: string }[];
  tags: string[];
  categorySlug: string;
  createdAt: string;
}

export const availableOf = (variant: Variant) => Math.max(0, variant.stock - variant.reserved);

export const productAvailable = (product: Product) =>
  product.variants.reduce((sum, v) => sum + availableOf(v), 0);

export const discountPercent = (product: Product) =>
  product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

export function toProductCard(product: Product): ProductCard {
  const discount = discountPercent(product);
  const available = productAvailable(product);
  const category = getDb().categories.find((c) => c.id === product.categoryId);
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    brand: product.brand,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    discountPercent: discount,
    image: product.images[0]?.url ?? "",
    hoverImage: product.images[1]?.url ?? product.images[0]?.url ?? "",
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    availableStock: available,
    inStock: available > 0 && product.status === "active",
    badge: discount > 0 ? "sale" : product.tags.includes("new") ? "new" : product.tags.includes("bestseller") ? "bestseller" : null,
    colors: productColours(product),
    tags: product.tags,
    categorySlug: category?.slug ?? "",
    createdAt: product.createdAt,
  };
}

export function categoryDescendantIds(categoryId: string): string[] {
  const all = getDb().categories;
  const ids = [categoryId];
  let frontier = [categoryId];
  while (frontier.length) {
    const children = all.filter((c) => c.parentId && frontier.includes(c.parentId));
    const childIds = children.map((c) => c.id).filter((id) => !ids.includes(id));
    ids.push(...childIds);
    frontier = childIds;
  }
  return ids;
}

export function resolveCategory(slug: string): Category | undefined {
  return getDb().categories.find((c) => c.slug === slug);
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
  productCount: number;
}

export function categoryTree(): CategoryNode[] {
  const all = getDb().categories;
  const products = getDb().products.filter((p) => p.status === "active");
  const build = (parentId: string | null): CategoryNode[] =>
    all
      .filter((c) => (parentId ? c.parentId === parentId : !c.parentId))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => {
        const children = build(c.id);
        const ownCount = products.filter((p) => p.categoryId === c.id).length;
        const childCount = children.reduce((sum, child) => sum + child.productCount, 0);
        return { ...c, children, productCount: ownCount + childCount };
      });
  return build(null);
}

export interface ListQuery {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  brand?: string;
  inStock?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
  includeDrafts?: boolean;
}

export function filterProducts(query: ListQuery) {
  const all = getDb().products;
  let items = all.filter((p) => (query.includeDrafts ? true : p.status === "active"));

  if (query.category) {
    const category = resolveCategory(query.category);
    if (category) {
      if (category.slug === "sale") {
        items = items.filter((p) => discountPercent(p) > 0);
      } else {
        const ids = categoryDescendantIds(category.id);
        items = items.filter((p) => ids.includes(p.categoryId));
      }
    }
  }
  if (query.q) {
    const needle = query.q.toLowerCase();
    items = items.filter((p) =>
      [p.title, p.brand, p.description, ...p.tags].some((field) => field.toLowerCase().includes(needle))
    );
  }
  if (typeof query.minPrice === "number") items = items.filter((p) => p.price >= query.minPrice! * 100);
  if (typeof query.maxPrice === "number") items = items.filter((p) => p.price <= query.maxPrice! * 100);
  if (typeof query.rating === "number") items = items.filter((p) => p.ratingAvg >= query.rating!);
  if (query.brand) {
    const brands = query.brand.split(",").map((b) => b.trim().toLowerCase()).filter(Boolean);
    if (brands.length) items = items.filter((p) => brands.includes(p.brand.toLowerCase()));
  }
  if (query.inStock) items = items.filter((p) => productAvailable(p) > 0);

  const sort = query.sort ?? "popular";
  items = [...items].sort((a, b) => {
    switch (sort) {
      case "newest":
        return a.createdAt < b.createdAt ? 1 : -1;
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "rating":
        return b.ratingAvg - a.ratingAvg;
      case "popular":
      default:
        return b.sold - a.sold;
    }
  });

  const brands = new Map<string, number>();
  for (const product of items) brands.set(product.brand, (brands.get(product.brand) ?? 0) + 1);

  return {
    items,
    facets: {
      brands: [...brands.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value)),
      price: {
        min: items.length ? Math.min(...items.map((p) => p.price)) : 0,
        max: items.length ? Math.max(...items.map((p) => p.price)) : 0,
      },
    },
  };
}

export function getCartDocument(userId?: string, guestId?: string): Cart | undefined {
  return getDb().carts.find((c) => (userId ? c.userId === userId : c.guestId === guestId));
}

export function cartTotals(cart?: Cart) {
  const db = getDb();
  const items = (cart?.items ?? []).flatMap((item) => {
    const product = db.products.find((p) => p.id === item.productId && p.status === "active");
    const variant = product?.variants.find((v) => v.sku === item.sku);
    if (!product || !variant) return [];
    const available = availableOf(variant);
    const qty = Math.min(item.qty, Math.max(available, 0));
    return [
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        brand: product.brand,
        sku: variant.sku,
        options: variant.options,
        image: product.images[0]?.url ?? "",
        price: variant.price,
        compareAtPrice: product.compareAtPrice ?? null,
        qty,
        requestedQty: item.qty,
        available,
        inStock: available > 0,
        lowStock: available > 0 && available <= variant.lowStockThreshold,
        lineTotal: variant.price * qty,
        movedToWishlist: false,
      },
    ];
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const settings = db.settings;
  const shipping = subtotal === 0 || subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const tax = Math.round(subtotal * (settings.taxRatePercent / 100));
  return { items, count, subtotal, shipping, tax, total: subtotal + shipping };
}

export function normalizeImages(images: unknown, title: string): Product["images"] {
  if (!Array.isArray(images)) return [];
  return images
    .map((img, index) => {
      if (typeof img === "string") {
        return { url: img, alt: `${title} — view ${index + 1}`, publicId: "" };
      }
      if (img && typeof img === "object" && "url" in img) {
        const rec = img as Record<string, unknown>;
        return {
          url: String(rec.url),
          alt: String(rec.alt ?? `${title} — view ${index + 1}`),
          publicId: String(rec.publicId ?? ""),
        };
      }
      return null;
    })
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
}
