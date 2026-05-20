import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError, requireRole } from "@/lib/authz";
import { ProductType } from "@prisma/client";
import { generateUniqueProductSlug } from "@/lib/slug";
import { getAdminCommerceSettings } from "@/lib/admin-settings.server";

type CreateProductBody = {
  name: string;
  slug?: string | null;
  description?: string;
  type: ProductType;
  imageUrls?: string[];
  priceArs: number;
  priceUsd: number;
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

function normalizeVariantEntries(body: CreateProductBody) {
  const source = (body.variants?.length ? body.variants : body.inventories) ?? [];
  return source.map((variant, index) => ({
    physicalSize: variant.physicalSize,
    color: variant.color?.trim() || "Negro",
    stock: Math.max(0, Number(variant.stock) || 0),
    isActive: variant.isActive ?? true,
    lowStockThreshold: Math.max(0, Number(variant.lowStockThreshold) || 5),
    sortOrder: variant.sortOrder ?? index,
  }));
}

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() ?? "";
    const type = url.searchParams.get("type") as ProductType | null;
    const status = url.searchParams.get("status");

    const products = await prisma.product.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(type && Object.values(ProductType).includes(type) ? { type } : {}),
        ...(status === "active" ? { isActive: true } : {}),
        ...(status === "inactive" ? { isActive: false } : {}),
      },
      orderBy: { createdAt: "desc" },
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
            stock: true,
            lowStockThreshold: true,
          },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const body = await parseJson<CreateProductBody>(request);

    if (!body.name?.trim()) {
      throw new ApiError(400, "Nombre requerido");
    }
    if (!body.type || !Object.values(ProductType).includes(body.type)) {
      throw new ApiError(400, "Tipo de producto inválido");
    }
    if (Number(body.priceArs) <= 0 || Number(body.priceUsd) <= 0) {
      throw new ApiError(400, "Los precios deben ser mayores a 0");
    }

    const slug = await generateUniqueProductSlug(body.slug?.trim() || body.name);
    const commerceSettings = await getAdminCommerceSettings();
    const variantPayload =
      normalizeVariantEntries(body).length > 0
        ? normalizeVariantEntries(body)
        : [
            {
              physicalSize: "S" as const,
              color: "Negro",
              stock: 0,
              isActive: true,
              lowStockThreshold: commerceSettings.defaultLowStockThreshold,
              sortOrder: 0,
            },
          ];

    const product = await prisma.product.create({
      data: {
        slug,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        type: body.type,
        imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls.filter(Boolean) : [],
        priceArs: Number(body.priceArs),
        priceUsd: Number(body.priceUsd),
        compareAtPriceArs: body.compareAtPriceArs ? Number(body.compareAtPriceArs) : null,
        compareAtPriceUsd: body.compareAtPriceUsd ? Number(body.compareAtPriceUsd) : null,
        isActive: body.isActive ?? true,
        inventories: {
          create: variantPayload.map((variant) => ({
            physicalSize: variant.physicalSize,
            color: variant.color,
            stock: variant.stock,
            lowStockThreshold: variant.lowStockThreshold,
            isActive: variant.isActive,
            sortOrder: variant.sortOrder,
            sku: `${slug}-${variant.physicalSize}-${variant.color}`
              .normalize("NFKD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .toUpperCase(),
          })),
        },
      },
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

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
