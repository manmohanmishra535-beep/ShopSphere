import crypto from "node:crypto";

export const newId = (prefix: string) =>
  `${prefix}_${crypto.randomBytes(9).toString("hex")}`;

export const now = () => new Date().toISOString();

export const money = (paise: number) => Math.round(paise);

export const inr = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);

export const slugify = (input: string) =>
  input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");

export function hashQuery(value: unknown): string {
  return crypto
    .createHash("sha1")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 16);
}

export function daysAgo(n: number, hour = 12): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export function addMinutes(date: Date, minutes: number): string {
  return new Date(date.getTime() + minutes * 60_000).toISOString();
}
