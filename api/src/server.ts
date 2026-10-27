import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initDb, persist } from "./lib/db.js";
import { expiryJob } from "./lib/orders.js";
import { cache } from "./lib/cache.js";

async function main() {
  await initDb();
  const app = createApp();

  app.listen(env.port, () => {
    console.log(`\n  ShopSphere API`);
    console.log(`  http://localhost:${env.port}/api/v1`);
    console.log(`  health: http://localhost:${env.port}/health`);
    console.log(`  env: ${env.nodeEnv}\n`);
  });

  // Release stock holds for abandoned checkouts.
  setInterval(() => {
    try {
      expiryJob();
    } catch (error) {
      console.error("[jobs] reservation sweep failed", error);
    }
  }, 60_000);

  // Periodically flush any pending writes.
  setInterval(() => persist(), 30_000);
}

main().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});

export { cache };
