import { Router } from "express";
import crypto from "node:crypto";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { env } from "../../config/env.js";

export const mediaRouter = Router();

function signParams(params: Record<string, string>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${toSign}${secret}`).digest("hex");
}

/**
 * Issue a short-lived signature for direct browser -> Cloudinary uploads.
 * When CLOUDINARY_* is not configured, a clearly labelled demo signature keeps
 * the admin UI functional without external credentials.
 */
mediaRouter.post("/sign", authenticate, requireRole("admin"), (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = String(req.body?.folder ?? env.cloudinaryFolder);
  const configured = Boolean(
    env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret
  );

  if (!configured) {
    const demoSecret = "shopsphere-demo-secret";
    res.json({
      provider: "cloudinary-demo",
      cloudName: env.cloudinaryCloudName || "shopsphere-demo",
      apiKey: env.cloudinaryApiKey || "demo-key",
      timestamp,
      folder,
      signature: signParams({ folder, timestamp: String(timestamp) }, demoSecret),
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName || "shopsphere-demo"}/image/upload`,
      constraints: { formats: ["jpg", "png", "webp", "avif"], maxBytes: 5 * 1024 * 1024 },
      note: "Demo signature. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET for real signed uploads.",
    });
    return;
  }

  const params: Record<string, string> = { folder, timestamp: String(timestamp) };
  if (env.cloudinaryUploadPreset) params.upload_preset = env.cloudinaryUploadPreset;

  res.json({
    provider: "cloudinary",
    cloudName: env.cloudinaryCloudName,
    apiKey: env.cloudinaryApiKey,
    timestamp,
    folder,
    uploadPreset: env.cloudinaryUploadPreset || undefined,
    signature: signParams(params, env.cloudinaryApiSecret),
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`,
    constraints: { formats: ["jpg", "png", "webp", "avif"], maxBytes: 5 * 1024 * 1024 },
  });
});
