import path from "node:path";
import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Both workspaces share the repository root; without this Next may pick an
  // unrelated lockfile in the user's home directory as the tracing root.
  outputFileTracingRoot: path.join(__dirname, ".."),
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` }];
  },
};

export default nextConfig;
