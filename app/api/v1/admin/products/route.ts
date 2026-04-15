import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError, requireRole } from "@/lib/authz";
import { ProductType } from "@prisma/client";
import { generateUniqueProductSlug } from "@/lib/slug";

type CreateProductBody = {
  name: string;
  description?: string;
  type: ProductType;
  imageUrls?: string[];
  priceArs: number;
  priceUsd: number;
  compareAtPriceArs?: number | null;
  compareAtPriceUsd?: number | null;
  isActive?: boolean;
  inventories?: Array<{
    physicalSize: "S" | "M" | "L";
    stock: number;
    lowStockThreshold?: number;
  }>;
};

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

    const slug = await generateUniqueProductSlug(body.name);
    const inventoryPayload = body.inventories ?? [
      { physicalSize: "S", stock: 0, lowStockThreshold: 5 },
      { physicalSize: "M", stock: 0, lowStockThreshold: 5 },
      { physicalSize: "L", stock: 0, lowStockThreshold: 5 },
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
          create: inventoryPayload.map((inventory) => ({
            physicalSize: inventory.physicalSize,
            stock: Math.max(0, Number(inventory.stock) || 0),
            lowStockThreshold: Math.max(0, Number(inventory.lowStockThreshold) || 5),
            sku: `${slug}-${inventory.physicalSize}`.toUpperCase(),
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
            stock: true,
            lowStockThreshold: true,
          },
        },
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
