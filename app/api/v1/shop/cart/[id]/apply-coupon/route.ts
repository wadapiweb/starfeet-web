import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { cartExpirationFrom, isCartExpired } from "@/lib/cart";
import { getAdminCommerceSettings } from "@/lib/admin-settings.server";

type Body = {
  code: string;
};

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const { code } = await parseJson<Body>(request);

    if (!code) {
      throw new ApiError(400, "Código de cupón obligatorio");
    }

    const cart = await prisma.cart.findUnique({ where: { id } });
    if (!cart) {
      throw new ApiError(404, "Carrito no encontrado");
    }
    if (cart.status !== "ACTIVE" || isCartExpired(cart.expiresAt)) {
      throw new ApiError(409, "Carrito expirado o inactivo");
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code: normalizedCode } });

    if (!coupon || !coupon.isActive) {
      throw new ApiError(404, "Cupón inválido o inactivo");
    }
    if (!coupon.expiresAt || coupon.expiresAt.getTime() <= Date.now()) {
      throw new ApiError(409, "Cupón vencido");
    }
    if (coupon.usageCount >= coupon.maxUses) {
      throw new ApiError(409, "Cupón sin usos disponibles");
    }

    const commerceSettings = await getAdminCommerceSettings();
    const updated = await prisma.cart.update({
      where: { id },
      data: {
        couponId: coupon.id,
        lastActivityAt: new Date(),
        expiresAt: cartExpirationFrom(new Date(), commerceSettings.cartTtlMinutes),
      },
    });

    return NextResponse.json({ cart: updated, coupon });
  } catch (error) {
    return jsonError(error);
  }
}
