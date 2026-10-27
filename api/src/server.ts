import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closeDb, flushDb, hasPendingWrites, initDb } from "./lib/db.js";
import { expiryJob } from "./lib/orders.js";
import { cache } from "./lib/cache.js";
import { assertPaymentConfig, getPaymentProvider } from "./lib/payments/index.js";

async function main() {
  await cache.init();
  assertPaymentConfig();
  getPaymentProvider();
  await initDb();

  const app = createApp();
  const shutdown = async (signal: string) => {
    console.log(`\n[server] ${signal} received, flushing data...`);
    await closeDb();
    await cache.close();
    process.exit(0);
  };
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  app.listen(env.port, () => {
    console.log(`\n  ShopSphere API`);
    console.log(`  http://localhost:${env.port}/api/v1`);
    console.log(`  health: http://localhost:${env.port}/health`);
    console.log(`  env: ${env.nodeEnv}`);
    console.log(`  db: ${env.mongoUrl ? "mongodb" : "json file"} | cache: ${cache.info().driver} | payments: ${env.paymentProvider}\n`);
  });

  // Release stock holds for abandoned checkouts.
  setInterval(() => {
    try {
      expiryJob();
    } catch (error) {
      console.error("[jobs] reservation sweep failed", error);
    }
  }, 60_000);

  // Periodic safety net; ordinary mutations already schedule a debounced flush.
  setInterval(() => {
    if (hasPendingWrites()) void flushDb();
  }, 30_000);
}

main().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});

export { cache };
