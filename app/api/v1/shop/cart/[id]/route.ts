import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { cartExpirationFrom, isCartExpired } from "@/lib/cart";
import { getAdminCommerceSettings } from "@/lib/admin-settings.server";
import { Gender } from "@prisma/client";

type UpdateCartBody =
  | {
      action: "touch";
    }
  | {
      action: "add_item";
      productId: string;
      inventoryId?: string;
      gender?: Gender;
      size?: string;
      quantity: number;
    }
  | {
      action: "update_item";
      itemId: string;
      quantity: number;
    }
  | {
      action: "remove_item";
      itemId: string;
    };

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const body = await parseJson<UpdateCartBody>(request);

    const cart = await prisma.cart.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!cart) {
      throw new ApiError(404, "Carrito no encontrado");
    }
    if (cart.status !== "ACTIVE" || isCartExpired(cart.expiresAt)) {
      throw new ApiError(409, "Carrito expirado o inactivo");
    }

    const now = new Date();
    const commerceSettings = await getAdminCommerceSettings();
    const nextExpiry = cartExpirationFrom(now, commerceSettings.cartTtlMinutes);

    if (body.action === "touch") {
      const updated = await prisma.cart.update({
        where: { id },
        data: { lastActivityAt: now, expiresAt: nextExpiry },
      });
      return NextResponse.json({ cart: updated });
    }

    if (body.action === "remove_item") {
      const item = cart.items.find((currentItem) => currentItem.id === body.itemId);
      if (!item) {
        throw new ApiError(404, "Ítem no encontrado");
      }

      await prisma.cartItem.delete({
        where: { id: item.id },
      });

      const updated = await prisma.cart.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });

      await prisma.cart.update({
        where: { id },
        data: { lastActivityAt: now, expiresAt: nextExpiry },
      });

      return NextResponse.json({ cart: updated });
    }

    if (body.action === "update_item") {
      if (body.quantity <= 0) {
        throw new ApiError(400, "quantity debe ser mayor a cero");
      }

      const currentItem = cart.items.find((item) => item.id === body.itemId);
      if (!currentItem) {
        throw new ApiError(404, "Ítem no encontrado");
      }

      const product = await prisma.product.findUnique({
        where: { id: currentItem.productId },
        include: {
          inventories: {
            select: { id: true, stock: true, physicalSize: true, color: true, isActive: true, sortOrder: true },
          },
        },
      });
      if (!product || !product.isActive) {
        throw new ApiError(404, "Producto no disponible");
      }

      if (currentItem.inventoryId) {
        const targetInventory = product.inventories.find((inv) => inv.id === currentItem.inventoryId);
        if (!targetInventory) {
          throw new ApiError(400, "inventoryId inválido para el producto");
        }
        if (!targetInventory.isActive) {
          throw new ApiError(409, "La variante seleccionada está desactivada");
        }

        const reservedForSameInventory = cart.items
          .filter(
            (item) =>
              item.id !== currentItem.id &&
              item.productId === currentItem.productId &&
              item.inventoryId === currentItem.inventoryId,
          )
          .reduce((sum, item) => sum + item.quantity, 0);
        if (reservedForSameInventory + body.quantity > targetInventory.stock) {
          throw new ApiError(409, "Stock insuficiente para el talle seleccionado");
        }
      } else {
        const totalStock = product.inventories.reduce((sum, inv) => sum + inv.stock, 0);
        const reservedForProduct = cart.items
          .filter((item) => item.id !== currentItem.id && item.productId === currentItem.productId)
          .reduce((sum, item) => sum + item.quantity, 0);
        if (reservedForProduct + body.quantity > totalStock) {
          throw new ApiError(409, "Stock insuficiente para este producto");
        }
      }

      await prisma.cartItem.update({
        where: { id: currentItem.id },
        data: { quantity: body.quantity, updatedAt: now },
      });

      const updated = await prisma.cart.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });

      await prisma.cart.update({
        where: { id },
        data: { lastActivityAt: now, expiresAt: nextExpiry },
      });

      return NextResponse.json({ cart: updated });
    }

    if (body.action !== "add_item" || body.quantity <= 0) {
      throw new ApiError(400, "Acción inválida");
    }

    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      include: {
        inventories: {
          select: { id: true, stock: true, physicalSize: true, color: true, isActive: true, sortOrder: true },
        },
      },
    });
    if (!product || !product.isActive) {
      throw new ApiError(404, "Producto no disponible");
    }

    const activeInventories = product.inventories.filter((inv) => inv.isActive && inv.stock > 0);

    if (body.inventoryId) {
      const targetInventory = product.inventories.find((inv) => inv.id === body.inventoryId);
      if (!targetInventory) {
        throw new ApiError(400, "inventoryId inválido para el producto");
      }
      if (!targetInventory.isActive) {
        throw new ApiError(409, "La variante seleccionada está desactivada");
      }
      const reservedForSameInventory = cart.items
        .filter((item) => item.productId === body.productId && item.inventoryId === body.inventoryId)
        .reduce((sum, item) => sum + item.quantity, 0);
      if (reservedForSameInventory + body.quantity > targetInventory.stock) {
        throw new ApiError(409, "Stock insuficiente para el talle seleccionado");
      }
    } else if (activeInventories.length > 0) {
      throw new ApiError(400, "Debés seleccionar una variante disponible");
    } else {
      const totalStock = product.inventories.reduce((sum, inv) => sum + inv.stock, 0);
      const reservedForProduct = cart.items
        .filter((item) => item.productId === body.productId)
        .reduce((sum, item) => sum + item.quantity, 0);
      if (reservedForProduct + body.quantity > totalStock) {
        throw new ApiError(409, "Stock insuficiente para este producto");
      }
    }

    const unitPrice = cart.currency === "USD" ? product.priceUsd : product.priceArs;

    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: id,
        productId: body.productId,
        inventoryId: body.inventoryId ?? null,
        gender: body.gender ?? null,
        size: body.size ?? null,
      },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + body.quantity, updatedAt: now },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: id,
          productId: body.productId,
          inventoryId: body.inventoryId,
          gender: body.gender ?? null,
          size: body.size ?? null,
          quantity: body.quantity,
          unitPrice,
        },
      });
    }

    const updated = await prisma.cart.update({
      where: { id },
      data: { lastActivityAt: now, expiresAt: nextExpiry },
      include: { items: true },
    });

    return NextResponse.json({ cart: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(_request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const cart = await prisma.cart.findUnique({
      where: { id },
      include: {
        coupon: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
            maxUses: true,
            usageCount: true,
            expiresAt: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                priceArs: true,
                priceUsd: true,
                isActive: true,
                imageUrls: true,
              },
            },
            inventory: {
              select: { id: true, physicalSize: true, color: true, stock: true, isActive: true },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new ApiError(404, "Carrito no encontrado");
    }

    return NextResponse.json({ cart });
  } catch (error) {
    return jsonError(error);
  }
}
