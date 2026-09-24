import type { NextConfig } from "next";

// Server Actions default to a 1MB body limit; raise it to match
// MAX_UPLOAD_SIZE_MB (see .env) so document attachments aren't rejected
// before reaching the app's own size check in src/lib/storage.ts.
const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB) || 20;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.9.200.75"],
  experimental: {
    serverActions: {
      bodySizeLimit: `${maxUploadSizeMb}mb`,
    },
  },
};

export default nextConfig;
