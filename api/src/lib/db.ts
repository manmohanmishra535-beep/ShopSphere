import fs from "node:fs";
import path from "node:path";
import { MongoClient, type Db, type Document } from "mongodb";
import { env } from "../config/env.js";
import type { Database } from "../types.js";
import { buildSeed, buildSettings } from "../seed/seed.js";

/**
 * Two storage drivers share one synchronous in-process working set:
 *
 * - JSON file (default): the demo database, flushed after every mutation.
 * - MongoDB (`MONGODB_URI`): collections are loaded on boot, then persisted as
 *   debounced snapshots. The routes keep their synchronous model API.
 *
 * The Mongo driver is intentionally a snapshot adapter: it is durable, indexed
 * and safe for a single API process. For multi-writer horizontal scaling,
 * replace the `getDb()` access pattern with per-collection repositories (or a
 * document database with atomic updates); the TypeScript models already map
 * one-to-one to the collections created here.
 */

const ARRAY_COLLECTIONS = [
  "users",
  "categories",
  "products",
  "carts",
  "wishlists",
  "orders",
  "reviews",
  "stockMovements",
  "auditLogs",
] as const;

type ArrayCollection = (typeof ARRAY_COLLECTIONS)[number];

const SETTINGS_COLLECTION = "settings";
const SETTINGS_ID = "singleton";

/** MongoDB `_id` is a string (our domain ids), not an ObjectId. */
type MongoRecord = Document & { _id: string };

let database: Database | null = null;
let writeTimer: NodeJS.Timeout | null = null;
let flushing: Promise<void> | null = null;
let queued = false;
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

function emptyDatabase(): Database {
  return {
    users: [],
    categories: [],
    products: [],
    carts: [],
    wishlists: [],
    orders: [],
    reviews: [],
    stockMovements: [],
    auditLogs: [],
    settings: buildSettings(),
  };
}

async function seedDatabase(): Promise<Database> {
  return env.seedDemoData ? buildSeed() : emptyDatabase();
}

function writeJsonFile(data: Database): void {
  fs.mkdirSync(path.dirname(env.dataFile), { recursive: true });
  fs.writeFileSync(env.dataFile, JSON.stringify(data, null, 2));
}

async function ensureFile(): Promise<Database> {
  if (fs.existsSync(env.dataFile)) {
    try {
      const raw = fs.readFileSync(env.dataFile, "utf8");
      return JSON.parse(raw) as Database;
    } catch {
      console.warn("[db] Could not parse data file, reseeding.");
    }
  }
  const seeded = await seedDatabase();
  writeJsonFile(seeded);
  console.log(
    `[db] Seeded ${seeded.products.length} products, ${seeded.orders.length} orders -> ${env.dataFile}`
  );
  return seeded;
}

async function createIndexes(db: Db): Promise<void> {
  const indexes: Array<[string, Record<string, 1 | -1>, { unique?: boolean }]> = [
    ["users", { email: 1 }, { unique: true }],
    ["products", { slug: 1 }, { unique: true }],
    ["orders", { orderNumber: 1 }, { unique: true }],
    ["orders", { userId: 1, createdAt: -1 }, {}],
    ["reviews", { productId: 1, status: 1 }, {}],
    ["carts", { userId: 1 }, {}],
    ["categories", { slug: 1 }, {}],
  ];
  for (const [collection, keys, options] of indexes) {
    try {
      await db.collection(collection).createIndex(keys, options);
    } catch (error) {
      // Duplicate historical data should not stop the API from booting.
      console.warn(`[db] Could not create index on ${collection}`, error);
    }
  }
}

async function loadMongo(db: Db): Promise<Database> {
  const rows = await Promise.all(
    ARRAY_COLLECTIONS.map((key) => db.collection<MongoRecord>(key).find({}).toArray())
  );
  const loaded = emptyDatabase() as unknown as Record<string, unknown>;
  ARRAY_COLLECTIONS.forEach((key, index) => {
    loaded[key] = rows[index].map(({ _id: _ignored, ...rest }) => rest);
  });

  const settings = await db.collection<MongoRecord>(SETTINGS_COLLECTION).findOne({ _id: SETTINGS_ID });
  if (settings) {
    const { _id: _ignored, ...rest } = settings;
    loaded.settings = { ...buildSettings(), ...rest };
  }

  return loaded as unknown as Database;
}

async function writeMongoSnapshot(db: Db, data: Database): Promise<void> {
  await Promise.all(
    ARRAY_COLLECTIONS.map(async (key) => {
      const items = data[key] as Array<{ id: string }>;
      const collection = db.collection<MongoRecord>(key);
      if (items.length > 0) {
        await collection.bulkWrite(
          items.map((item) => ({
            replaceOne: {
              filter: { _id: item.id },
              replacement: { ...(item as unknown as Document), _id: item.id },
              upsert: true,
            },
          })),
          { ordered: false }
        );
      }
      // Mirror deletions from the working set.
      await collection.deleteMany({ _id: { $nin: items.map((item) => item.id) } });
    })
  );
  await db
    .collection<MongoRecord>(SETTINGS_COLLECTION)
    .replaceOne(
      { _id: SETTINGS_ID },
      { ...(data.settings as unknown as MongoRecord), _id: SETTINGS_ID },
      { upsert: true }
    );
}

async function writeSnapshot(): Promise<void> {
  if (!database) return;
  if (mongoDb) {
    await writeMongoSnapshot(mongoDb, database);
    return;
  }
  writeJsonFile(database);
}

async function flush(): Promise<void> {
  if (!database) return;
  if (flushing) {
    queued = true;
    return flushing;
  }

  flushing = (async () => {
    do {
      queued = false;
      await writeSnapshot();
    } while (queued);
  })()
    .catch((error) => console.error("[db] persist failed", error))
    .finally(() => {
      flushing = null;
    });
  return flushing;
}

export async function initDb(): Promise<Database> {
  if (database) return database;

  if (env.mongoUrl) {
    const client = new MongoClient(env.mongoUrl, { serverSelectionTimeoutMS: 8_000 });
    try {
      await client.connect();
    } catch (error) {
      await client.close().catch(() => undefined);
      throw new Error(
        `Could not connect to MongoDB at the configured MONGODB_URI: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    mongoClient = client;
    mongoDb = env.mongoDb ? client.db(env.mongoDb) : client.db();
    await createIndexes(mongoDb);
    database = await loadMongo(mongoDb);

    if (database.users.length === 0 && database.products.length === 0) {
      database = await seedDatabase();
      await writeMongoSnapshot(mongoDb, database);
      console.log(
        `[db] Seeded ${database.products.length} products, ${database.orders.length} orders -> MongoDB (${mongoDb.databaseName})`
      );
    } else {
      console.log(
        `[db] Loaded ${database.products.length} products, ${database.orders.length} orders, ${database.users.length} users <- MongoDB (${mongoDb.databaseName})`
      );
    }
    return database;
  }

  database = await ensureFile();
  return database;
}

export function getDb(): Database {
  if (!database) throw new Error("Database not initialised");
  return database;
}

/** Debounced persistence. JSON writes flush in ~40ms, Mongo snapshots in ~150ms. */
export function persist(): void {
  if (!database) return;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(
    () => {
      writeTimer = null;
      void flush();
    },
    mongoDb ? 150 : 40
  );
}

/** Flush pending writes immediately (used by resetDb and graceful shutdown). */
export async function flushDb(): Promise<void> {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  await flush();
}

export async function resetDb(): Promise<Database> {
  const seeded = await seedDatabase();
  database = seeded;
  await writeSnapshot();
  return seeded;
}

export async function closeDb(): Promise<void> {
  await flushDb();
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    mongoDb = null;
  }
}

export const db = new Proxy({} as Database, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
