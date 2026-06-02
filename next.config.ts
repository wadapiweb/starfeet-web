import type { NextConfig } from "next";

// Domain resolution — edit .env to change, no code changes needed
const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || ".starfeet.ar";
const cleanBase = process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
  (baseDomain.startsWith(".") ? baseDomain.slice(1) : baseDomain);

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    cleanBase,
    `dev.${cleanBase}`,
    `dev1.${cleanBase}`,
    `tienda.${cleanBase}`,
    `kine.${cleanBase}`,
    `dashboard.${cleanBase}`,
    `dev-tienda.${cleanBase}`,
    `dev-kine.${cleanBase}`,
    `dev-dashboard.${cleanBase}`,
    "localhost:3000",
    "127.0.0.1:3000",
  ],
};

export default nextConfig;
