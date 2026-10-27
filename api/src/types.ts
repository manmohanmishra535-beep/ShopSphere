export type Role = "customer" | "admin";

export type OrderStatus =
  | "pending"
  | "paid"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "created" | "paid" | "failed" | "refunded";

export type ReviewStatus = "pending" | "published" | "hidden";

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

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: Role;
  phone?: string;
  addresses: Address[];
  createdAt: string;
  clerkId?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  imageUrl?: string;
  sortOrder: number;
}

export interface Variant {
  sku: string;
  options: Record<string, string>;
  price: number;
  stock: number;
  reserved: number;
  lowStockThreshold: number;
}

export interface ProductImage {
  publicId?: string;
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  brand: string;
  categoryId: string;
  price: number;
  compareAtPrice?: number | null;
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
}

export interface CartItem {
  productId: string;
  sku: string;
  qty: number;
}

export interface Cart {
  id: string;
  userId?: string | null;
  guestId?: string | null;
  items: CartItem[];
  updatedAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  productIds: string[];
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
    status: PaymentStatus;
    method?: string;
    amount: number;
  };
  timeline: TimelineEvent[];
  tracking?: { carrier: string; awb: string; url?: string };
  reservationExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  status: ReviewStatus;
  helpful: number;
  reply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  sku: string;
  delta: number;
  reason: "sale" | "cancellation" | "restock" | "damage" | "correction";
  note?: string;
  actor: string;
  at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target: string;
  at: string;
  meta?: Record<string, unknown>;
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

export interface Database {
  users: User[];
  categories: Category[];
  products: Product[];
  carts: Cart[];
  wishlists: Wishlist[];
  orders: Order[];
  reviews: Review[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  settings: Settings;
}
