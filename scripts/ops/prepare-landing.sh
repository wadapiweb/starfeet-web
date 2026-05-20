#!/bin/bash
set -e

LANDING_DIR="/opt/docker/starfeet-landing"
SOURCE_DIR="/opt/docker/starfeet-web"

echo "Creating landing directory..."
mkdir -p "$LANDING_DIR"

echo "Copying configuration files..."
cp "$SOURCE_DIR/tsconfig.json" "$LANDING_DIR/"
cp "$SOURCE_DIR/tailwind.config.ts" "$LANDING_DIR/"
cp "$SOURCE_DIR/postcss.config.mjs" "$LANDING_DIR/"
cp "$SOURCE_DIR/eslint.config.mjs" "$LANDING_DIR/"

echo "Creating NextConfig for static export..."
cat << 'EOF' > "$LANDING_DIR/next.config.ts"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true, // required for static export
  },
};

export default nextConfig;
EOF

echo "Copying static assets..."
cp -r "$SOURCE_DIR/public" "$LANDING_DIR/"

echo "Copying shared components..."
cp -r "$SOURCE_DIR/components" "$LANDING_DIR/"

echo "Creating App Router directories..."
mkdir -p "$LANDING_DIR/app"
mkdir -p "$LANDING_DIR/app/fonts"
mkdir -p "$LANDING_DIR/app/tecnologia"
mkdir -p "$LANDING_DIR/app/nosotros"

echo "Copying App Router files..."
cp "$SOURCE_DIR/app/layout.tsx" "$LANDING_DIR/app/"
cp "$SOURCE_DIR/app/globals.css" "$LANDING_DIR/app/"
cp "$SOURCE_DIR/app/page.tsx" "$LANDING_DIR/app/"
cp -r "$SOURCE_DIR/app/fonts" "$LANDING_DIR/app/"
cp -r "$SOURCE_DIR/app/tecnologia" "$LANDING_DIR/app/"
cp -r "$SOURCE_DIR/app/nosotros" "$LANDING_DIR/app/"

echo "Writing light package.json for landing page..."
cat << 'EOF' > "$LANDING_DIR/package.json"
{
  "name": "starfeet-landing",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "framer-motion": "^11.11.11",
    "lucide-react": "^0.453.0",
    "next": "16.1.6",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@types/node": "^20.17.6",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3"
  }
}
EOF

echo "Done preparing landing code!"
