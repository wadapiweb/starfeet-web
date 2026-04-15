import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError, requireRole } from "@/lib/authz";
import { Prisma, ProductType } from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

type PatchProductBody = {
  name?: string;
  description?: string | null;
  type?: ProductType;
  imageUrls?: string[];
  priceArs?: number;
  priceUsd?: number;
  compareAtPriceArs?: number | null;
  compareAtPriceUsd?: number | null;
  isActive?: boolean;
  inventories?: Array<{
    physicalSize: "S" | "M" | "L";
    stock: number;
    lowStockThreshold?: number;
  }>;
};

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

    const data = {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
      ...(body.type ? { type: body.type } : {}),
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

    if (body.inventories && body.inventories.length > 0) {
      const existingInventories = await prisma.productInventory.findMany({
        where: { productId: id },
        select: { id: true, physicalSize: true, sku: true },
      });

      const existingBySize = new Map(existingInventories.map((inv) => [inv.physicalSize, inv]));
      const product = await prisma.product.findUnique({
        where: { id },
        select: { slug: true },
      });
      const baseSku = (product?.slug ?? id).toUpperCase();

      for (const inventory of body.inventories) {
        const current = existingBySize.get(inventory.physicalSize);
        const nextData = {
          stock: Math.max(0, Number(inventory.stock) || 0),
          lowStockThreshold: Math.max(0, Number(inventory.lowStockThreshold) || 5),
        };

        if (current) {
          await prisma.productInventory.update({
            where: { id: current.id },
            data: nextData,
          });
        } else {
          await prisma.productInventory.create({
            data: {
              productId: id,
              physicalSize: inventory.physicalSize,
              sku: `${baseSku}-${inventory.physicalSize}`,
              ...nextData,
            },
          });
        }
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
            stock: true,
            lowStockThreshold: true,
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
