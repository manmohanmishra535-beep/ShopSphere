import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import type { Database } from "../types.js";
import { buildSeed } from "../seed/seed.js";

let database: Database | null = null;
let writeTimer: NodeJS.Timeout | null = null;

async function ensureFile(): Promise<Database> {
  const dir = path.dirname(env.dataFile);
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(env.dataFile)) {
    try {
      const raw = fs.readFileSync(env.dataFile, "utf8");
      return JSON.parse(raw) as Database;
    } catch {
      console.warn("[db] Could not parse data file, reseeding.");
    }
  }
  const seeded = await buildSeed();
  fs.writeFileSync(env.dataFile, JSON.stringify(seeded, null, 2));
  console.log(`[db] Seeded ${seeded.products.length} products, ${seeded.orders.length} orders -> ${env.dataFile}`);
  return seeded;
}

export async function initDb(): Promise<Database> {
  if (!database) database = await ensureFile();
  return database;
}

export function getDb(): Database {
  if (!database) throw new Error("Database not initialised");
  return database;
}

export function persist(): void {
  if (!database) return;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    try {
      fs.writeFileSync(env.dataFile, JSON.stringify(database, null, 2));
    } catch (error) {
      console.error("[db] persist failed", error);
    }
  }, 40);
}

export async function resetDb(): Promise<Database> {
  const seeded = await buildSeed();
  database = seeded;
  fs.mkdirSync(path.dirname(env.dataFile), { recursive: true });
  fs.writeFileSync(env.dataFile, JSON.stringify(seeded, null, 2));
  return seeded;
}

export const db = new Proxy({} as Database, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
