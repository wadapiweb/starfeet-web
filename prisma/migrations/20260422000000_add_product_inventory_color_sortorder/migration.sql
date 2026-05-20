-- Add missing variant metadata used by the storefront and admin UI.
ALTER TABLE "product_inventories"
  ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT 'Negro',
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
