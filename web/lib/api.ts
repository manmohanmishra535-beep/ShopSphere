import { cookies } from "next/headers";
import type {
  AdminProduct,
  AdminProductListResponse,
  AdminReview,
  AdminStats,
  CartResponse,
  Category,
  CustomerRow,
  HomePayload,
  InventoryRow,
  Order,
  OrderListResponse,
  Product,
  ProductCard,
  ProductListResponse,
  ReviewsResponse,
  Settings,
  User,
  WishlistResponse,
} from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  details: unknown[];
  code: string;

  constructor(status: number, message: string, code = "API_ERROR", details: unknown[] = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function serverApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const error = json?.error;
    throw new ApiError(
      res.status,
      error?.message ?? "Something went wrong",
      error?.code ?? "API_ERROR",
      error?.details ?? []
    );
  }
  return json as T;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const data = await serverApi<{ user: User }>("/auth/me");
    return data.user;
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const data = await serverApi<{ data: Category[] }>("/categories");
    return data.data;
  } catch {
    return [];
  }
}

export async function getHome(): Promise<HomePayload | null> {
  try {
    return await serverApi<HomePayload>("/storefront/home");
  } catch {
    return null;
  }
}

export async function getProducts(query: Record<string, string | number | boolean | undefined>): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "" || value === false) continue;
    params.set(key, String(value));
  }
  return serverApi<ProductListResponse>(`/products?${params.toString()}`);
}

export async function getProduct(slug: string): Promise<{ product: Product; related: ProductCard[] } | null> {
  try {
    return await serverApi<{ product: Product; related: ProductCard[] }>(`/products/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getReviews(productId: string, sort = "recent"): Promise<ReviewsResponse | null> {
  try {
    return await serverApi<ReviewsResponse>(`/products/${productId}/reviews?sort=${sort}`);
  } catch {
    return null;
  }
}

export async function getCart(): Promise<CartResponse | null> {
  try {
    return await serverApi<CartResponse>("/cart");
  } catch {
    return null;
  }
}

export async function getWishlist(): Promise<WishlistResponse | null> {
  try {
    return await serverApi<WishlistResponse>("/wishlist");
  } catch {
    return null;
  }
}

export async function getOrders(params: Record<string, string | number | undefined> = {}): Promise<OrderListResponse> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  return serverApi<OrderListResponse>(`/orders?${search.toString()}`);
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    const data = await serverApi<{ order: Order }>(`/orders/${id}`);
    return data.order;
  } catch {
    return null;
  }
}

export async function getAdminStats(days = 30): Promise<AdminStats | null> {
  try {
    return await serverApi<AdminStats>(`/admin/stats?days=${days}`);
  } catch {
    return null;
  }
}

export async function getInventory(filter = "all", q = ""): Promise<{ data: InventoryRow[]; counts: { all: number; low: number; out: number } }> {
  return serverApi(`/admin/inventory?filter=${filter}&q=${encodeURIComponent(q)}`);
}

export async function getAdminProducts(q = "", status = "all"): Promise<AdminProductListResponse> {
  return serverApi<AdminProductListResponse>(
    `/admin/products?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`
  );
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  try {
    const data = await serverApi<{ product: AdminProduct }>(`/admin/products/${encodeURIComponent(id)}`);
    return data.product;
  } catch {
    return null;
  }
}

export async function getCustomers(q = "", role = "all"): Promise<CustomerRow[]> {
  const data = await serverApi<{ data: CustomerRow[] }>(`/admin/users?q=${encodeURIComponent(q)}&role=${role}`);
  return data.data;
}

export async function getAdminReviews(status = "all"): Promise<{
  data: AdminReview[];
  counts: { all: number; pending: number; published: number; hidden: number };
}> {
  return serverApi(`/admin/reviews?status=${status}`);
}

export async function getSettings(): Promise<Settings> {
  const data = await serverApi<{ settings: Settings }>("/admin/settings");
  return data.settings;
}

export async function getAdminOrders(params: Record<string, string | number | undefined>): Promise<OrderListResponse> {
  return getOrders(params);
}
