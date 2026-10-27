import fs from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, "..");

// Load the first .env we find so `npm run dev` picks up local overrides.
for (const file of [path.join(apiRoot, ".env"), path.resolve(apiRoot, "..", ".env"), path.resolve(process.cwd(), ".env")]) {
  if (fs.existsSync(file)) {
    try {
      loadEnvFile(file);
    } catch {
      // A malformed .env should not stop the API from booting with defaults.
    }
    break;
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "shopsphere-dev-secret-change-me",
  cookieName: "ss_token",
  guestCookieName: "ss_guest",
  dataFile: process.env.DB_FILE ?? path.join(apiRoot, "data", "db.json"),
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "mock",
  seedDemoData: process.env.SEED_DEMO !== "false",
};

export const isProd = env.nodeEnv === "production";
