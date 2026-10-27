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

  // Persistence. When MONGODB_URI is unset the JSON file stays the source of truth.
  mongoUrl: process.env.MONGODB_URI?.trim() ?? "",
  mongoDb: process.env.MONGODB_DB?.trim() ?? "",

  // Cache. REDIS_URL enables the shared cache; otherwise an in-process TTL map is used.
  redisUrl: process.env.REDIS_URL?.trim() ?? "",

  // Payments. MOCK is the zero-config demo provider; razorpay enables live checkout.
  paymentProvider: (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase(),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID?.trim() ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET?.trim() ?? "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "",

  // Signed Cloudinary browser uploads.
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY?.trim() ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET?.trim() ?? "",
  cloudinaryFolder: process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "shopsphere/products",
  cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET?.trim() ?? "",

  seedDemoData: process.env.SEED_DEMO !== "false",
};

export const isProd = env.nodeEnv === "production";
