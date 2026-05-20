import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError, requireRole } from "@/lib/authz";
import { Prisma, ProductType } from "@prisma/client";
import { getAdminCommerceSettings } from "@/lib/admin-settings.server";
import { generateUniqueProductSlug } from "@/lib/slug";

type Params = {
  params: Promise<{ id: string }>;
};

type PatchProductBody = {
  name?: string;
  slug?: string | null;
  description?: string | null;
  type?: ProductType;
  imageUrls?: string[];
  priceArs?: number;
  priceUsd?: number;
  compareAtPriceArs?: number | null;
  compareAtPriceUsd?: number | null;
  isActive?: boolean;
  variants?: Array<{
    id?: string | null;
    physicalSize: "S" | "M" | "L";
    stock: number;
    color?: string;
    isActive?: boolean;
    lowStockThreshold?: number;
    sortOrder?: number;
  }>;
  inventories?: Array<{
    id?: string | null;
    physicalSize: "S" | "M" | "L";
    stock: number;
    color?: string;
    isActive?: boolean;
    lowStockThreshold?: number;
    sortOrder?: number;
  }>;
};

function normalizeSku(slug: string, size: string, color: string) {
  return `${slug}-${size}-${color}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

function normalizeVariantEntries(body: PatchProductBody) {
  const source = (body.variants?.length ? body.variants : body.inventories) ?? [];
  return source.map((variant, index) => ({
    id: variant.id ?? null,
    physicalSize: variant.physicalSize,
    color: variant.color?.trim() || "Negro",
    stock: Math.max(0, Number(variant.stock) || 0),
    isActive: variant.isActive ?? true,
    lowStockThreshold: Math.max(0, Number(variant.lowStockThreshold) || 5),
    sortOrder: variant.sortOrder ?? index,
  }));
}

export async function PATCH(request: Request, context: Params) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const body = await parseJson<PatchProductBody>(request);

    if (body.type && !Object.values(ProductType).includes(body.type)) {
      throw new ApiError(400, "Tipo de producto inválido");
    }

    if (body.priceArs !== undefined && Number(body.priceArs) <= 0) {
      throw new ApiError(400, "priceArs debe ser mayor a 0");
    }
    if (body.priceUsd !== undefined && Number(body.priceUsd) <= 0) {
      throw new ApiError(400, "priceUsd debe ser mayor a 0");
    }

    const commerceSettings = await getAdminCommerceSettings();
    const existingProduct = await prisma.product.findUniqueOrThrow({
      where: { id },
      select: { name: true, slug: true },
    });
    const nextSlug =
      body.slug !== undefined ? await generateUniqueProductSlug(body.slug?.trim() || body.name?.trim() || existingProduct.name, id) : existingProduct.slug;
    const variantPayload = normalizeVariantEntries(body);
    const data = {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
      ...(body.type ? { type: body.type } : {}),
      ...(body.slug !== undefined ? { slug: nextSlug } : {}),
      ...(body.imageUrls ? { imageUrls: body.imageUrls.filter(Boolean) } : {}),
      ...(body.priceArs !== undefined ? { priceArs: Number(body.priceArs) } : {}),
      ...(body.priceUsd !== undefined ? { priceUsd: Number(body.priceUsd) } : {}),
      ...(body.compareAtPriceArs !== undefined
        ? { compareAtPriceArs: body.compareAtPriceArs ? Number(body.compareAtPriceArs) : null }
        : {}),
      ...(body.compareAtPriceUsd !== undefined
        ? { compareAtPriceUsd: body.compareAtPriceUsd ? Number(body.compareAtPriceUsd) : null }
        : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    };

    await prisma.product.update({
      where: { id },
      data,
    });

    if (variantPayload.length > 0) {
      const existingInventories = await prisma.productInventory.findMany({
        where: { productId: id },
        select: { id: true, physicalSize: true, color: true, sku: true },
      });

      const existingById = new Map(existingInventories.map((inv) => [inv.id, inv]));
      const existingByKey = new Map(existingInventories.map((inv) => [`${inv.physicalSize}:${inv.color}`.toLowerCase(), inv]));
      const baseSlug = nextSlug ?? existingProduct.slug ?? existingProduct.name;
      const seenIds = new Set<string>();

      for (const variant of variantPayload) {
        const key = `${variant.physicalSize}:${variant.color}`.toLowerCase();
        const current = (variant.id && existingById.get(variant.id)) ?? existingByKey.get(key);
        const nextData = {
          stock: variant.stock,
          lowStockThreshold: variant.lowStockThreshold || commerceSettings.defaultLowStockThreshold,
          isActive: variant.isActive,
          sortOrder: variant.sortOrder,
          color: variant.color,
          sku: normalizeSku(baseSlug, variant.physicalSize, variant.color),
        };

        if (current) {
          seenIds.add(current.id);
          await prisma.productInventory.update({
            where: { id: current.id },
            data: nextData,
          });
        } else {
          await prisma.productInventory.create({
            data: {
              productId: id,
              physicalSize: variant.physicalSize,
              ...nextData,
            },
          });
        }
      }

      const removed = existingInventories.filter((inventory) => !seenIds.has(inventory.id));
      if (removed.length > 0) {
        await prisma.productInventory.updateMany({
          where: { id: { in: removed.map((inventory) => inventory.id) } },
          data: { isActive: false, stock: 0 },
        });
      }
    }

    const product = await prisma.product.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        type: true,
        imageUrls: true,
        priceArs: true,
        priceUsd: true,
        compareAtPriceArs: true,
        compareAtPriceUsd: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        inventories: {
          orderBy: { physicalSize: "asc" },
          select: {
            id: true,
            sku: true,
            physicalSize: true,
            color: true,
            stock: true,
            lowStockThreshold: true,
            isActive: true,
            sortOrder: true,
          },
        },
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_: Request, context: Params) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;

    try {
      await prisma.product.delete({ where: { id } });
      return NextResponse.json({ ok: true, mode: "deleted" });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2003" || error.code === "P2014")
      ) {
        await prisma.product.update({
          where: { id },
          data: { isActive: false },
        });
        return NextResponse.json({ ok: true, mode: "deactivated" });
      }
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
