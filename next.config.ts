import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "starfeet.ar",
    "dev.starfeet.ar",
    "dev1.starfeet.ar",
    "tienda.starfeet.ar",
    "kine.starfeet.ar",
    "dashboard.starfeet.ar",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
};

export default nextConfig;
