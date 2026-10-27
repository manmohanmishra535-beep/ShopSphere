import { Router } from "express";
import crypto from "node:crypto";
import { authenticate, requireRole } from "../../middleware/auth.js";

export const mediaRouter = Router();

mediaRouter.post("/sign", authenticate, requireRole("admin"), (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = String(req.body?.folder ?? "shopsphere/products");
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}shopsphere-demo-secret`)
    .digest("hex");

  res.json({
    provider: "cloudinary-demo",
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "shopsphere-demo",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "demo-key",
    timestamp,
    folder,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME ?? "shopsphere-demo"}/image/upload`,
    constraints: { formats: ["jpg", "png", "webp", "avif"], maxBytes: 5 * 1024 * 1024 },
    note: "Demo signature. Configure CLOUDINARY_* to enable real signed uploads.",
  });
});
