import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const inrFormatter2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Prices are stored in paise. */
export function formatINR(paise: number, opts?: { decimals?: boolean }): string {
  const value = paise / 100;
  return (opts?.decimals ? inrFormatter2 : inrFormatter).format(value);
}

export function formatINRCompact(paise: number): string {
  const value = paise / 100;
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(value >= 100000000 ? 0 : 1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(value >= 1000000 ? 0 : 1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return inrFormatter.format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatDate(value: string | Date, style: "short" | "long" | "day" = "short"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  if (style === "long") {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  }
  if (style === "day") {
    return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return formatDate(date);
}

export function deliveryEstimate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : (pluralForm ?? singular + "s")}`;
}

export function addSuffix(n: number): string {
  return `${n}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}
