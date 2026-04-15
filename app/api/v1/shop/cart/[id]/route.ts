import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { cartExpirationFrom, isCartExpired } from "@/lib/cart";

type UpdateCartBody =
  | {
      action: "touch";
    }
  | {
      action: "add_item";
      productId: string;
      inventoryId?: string;
      quantity: number;
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
    const nextExpiry = cartExpirationFrom(now);

    if (body.action === "touch") {
      const updated = await prisma.cart.update({
        where: { id },
        data: { lastActivityAt: now, expiresAt: nextExpiry },
      });
      return NextResponse.json({ cart: updated });
    }

    if (body.action !== "add_item" || body.quantity <= 0) {
      throw new ApiError(400, "Acción inválida");
    }

    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product || !product.isActive) {
      throw new ApiError(404, "Producto no disponible");
    }

    const unitPrice = cart.currency === "USD" ? product.priceUsd : product.priceArs;

    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: id,
        productId: body.productId,
        inventoryId: body.inventoryId ?? null,
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
              },
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
