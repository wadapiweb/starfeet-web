import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { cartExpirationFrom } from "@/lib/cart";
import { getAdminCommerceSettings } from "@/lib/admin-settings.server";
import { Currency } from "@prisma/client";

type CreateCartBody = {
  customerEmail: string;
  currency: Currency;
};

export async function POST(request: Request) {
  try {
    const body = await parseJson<CreateCartBody>(request);

    if (!body.customerEmail || !body.currency) {
      throw new ApiError(400, "customerEmail y currency son obligatorios");
    }

    const now = new Date();
    const commerceSettings = await getAdminCommerceSettings();
    const cart = await prisma.cart.create({
      data: {
        customerEmail: body.customerEmail.toLowerCase().trim(),
        currency: body.currency,
        lastActivityAt: now,
        expiresAt: cartExpirationFrom(now, commerceSettings.cartTtlMinutes),
      },
    });

    return NextResponse.json({ cart }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
