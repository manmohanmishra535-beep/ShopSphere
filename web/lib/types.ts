export type Role = "customer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  addresses: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  imageUrl?: string;
  sortOrder: number;
  productCount?: number;
  children?: Category[];
}

export interface ProductImage {
  url: string;
  alt: string;
  publicId?: string;
}

export interface Variant {
  sku: string;
  options: Record<string, string>;
  price: number;
  stock: number;
  reserved: number;
  lowStockThreshold: number;
  available: number;
}

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

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  brand: string;
  categoryId: string;
  price: number;
  compareAtPrice: number | null;
  images: ProductImage[];
  attributes: Record<string, string>;
  variants: Variant[];
  status: "draft" | "active" | "archived";
  ratingAvg: number;
  ratingCount: number;
  sold: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  availableStock: number;
  category: { id: string; name: string; slug: string; parentId: string | null } | null;
}

export interface CartItemView {
  productId: string;
  slug: string;
  title: string;
  brand: string;
  sku: string;
  options: Record<string, string>;
  image: string;
  price: number;
  compareAtPrice: number | null;
  qty: number;
  requestedQty: number;
  available: number;
  inStock: boolean;
  lowStock: boolean;
  lineTotal: number;
}

export interface CartResponse {
  items: CartItemView[];
  count: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface OrderItem {
  productId: string;
  slug: string;
  title: string;
  sku: string;
  options: Record<string, string>;
  price: number;
  qty: number;
  image: string;
}

export interface TimelineEvent {
  status: string;
  note: string;
  at: string;
  by: string;
}

export type OrderStatus = "pending" | "paid" | "packed" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: Address;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: "INR";
  status: OrderStatus;
  deliveryMethod: "standard" | "express";
  payment: {
    provider: string;
    providerOrderId: string;
    paymentId?: string;
    status: "created" | "paid" | "failed" | "refunded";
    method?: string;
    amount: number;
  };
  timeline: TimelineEvent[];
  tracking?: { carrier: string; awb: string; url?: string };
  reservationExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  reviewedProductIds: string[];
  canCancel: boolean;
  customer?: { id: string; name: string; email: string; phone?: string } | null;
}

export interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  helpful: number;
  reply?: string;
  createdAt: string;
  author: string;
  verified: boolean;
}

export interface ReviewSummary {
  avg: number;
  count: number;
  histogram: { star: number; count: number }[];
  ratingAvg: number;
  ratingCount: number;
}

export interface ReviewsResponse {
  data: Review[];
  summary: ReviewSummary;
  canReview: boolean;
  myReview: (Review & { productTitle: string; status: string }) | null;
}

export interface ProductListResponse {
  data: ProductCard[];
  page: number;
  limit: number;
  total: number;
  pages: number;
  facets: { brands: { value: string; count: number }[]; price: { min: number; max: number } };
  category: { name: string; slug: string; parentId: string | null } | null;
  siblings: { name: string; slug: string }[];
  appliedFilters: {
    q: string | null;
    category: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    rating: number | null;
    brands: string[];
    inStock: boolean;
    sort: string;
  };
}

export interface HomePayload {
  hero: Product;
  newArrivals: ProductCard[];
  bestSellers: ProductCard[];
  editorsPicks: ProductCard[];
  categories: Category[];
  stats: { products: number; happyCustomers: number };
}

export interface WishlistResponse {
  ids: string[];
  data: ProductCard[];
}

export interface OrderListResponse {
  data: Order[];
  page: number;
  limit: number;
  total: number;
  pages: number;
  counts: { all: number; toPack: number; shipped: number; delivered: number; cancelled: number };
}

export interface AdminStats {
  range: number;
  kpis: {
    revenue: { value: number; change: number };
    orders: { value: number; change: number };
    aov: { value: number; change: number };
    newCustomers: { value: number; change: number };
  };
  revenueByDay: { date: string; label: string; revenue: number; orders: number }[];
  topProducts: { productId: string; title: string; image: string; slug: string; units: number; revenue: number }[];
  lowStock: {
    sku: string;
    productId: string;
    title: string;
    image: string;
    options: Record<string, string>;
    available: number;
    threshold: number;
    out: boolean;
  }[];
  latestOrders: {
    id: string;
    orderNumber: string;
    total: number;
    status: OrderStatus;
    paymentStatus: string;
    createdAt: string;
    customerName: string;
  }[];
  counts: {
    toPack: number;
    pendingReviews: number;
    lowStock: number;
    outOfStock: number;
    products: number;
    customers: number;
  };
}

export interface AdminProduct extends Product {
  onHand: number;
  reserved: number;
}

export interface AdminProductListResponse {
  data: AdminProduct[];
  total: number;
  counts: { all: number; active: number; draft: number; archived: number };
}

export interface InventoryRow {
  sku: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  image: string;
  status: string;
  options: Record<string, string>;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  low: boolean;
  out: boolean;
  updatedAt: string;
}

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  createdAt: string;
  orderCount: number;
  totalSpend: number;
  addressCity: string | null;
  lastOrderAt: string | null;
}

export interface AdminReview extends Review {
  productId: string;
  productTitle: string;
  productSlug: string;
  productImage: string;
  authorEmail: string;
  orderNumber: string;
  status: "pending" | "published" | "hidden";
  userId: string;
}

export interface Settings {
  storeName: string;
  supportEmail: string;
  shippingFee: number;
  freeShippingThreshold: number;
  expressFee: number;
  taxRatePercent: number;
  lowStockEmail: boolean;
  orderEmail: boolean;
  paymentKeysConfigured: boolean;
  orderCounter: number;
}

export interface Quote {
  items: CartItemView[];
  count: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  deliveryMethod: "standard" | "express";
  reservationMinutes: number;
}

export interface CheckoutSession {
  order: Order;
  payment: { provider: string; providerOrderId: string; amount: number; currency: string; keyId: string };
  reservationExpiresAt: string;
}
