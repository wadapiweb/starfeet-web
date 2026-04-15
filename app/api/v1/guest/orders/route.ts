import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyGuestToken, guestSessionCookieName } from "@/lib/guest-session";
import { jsonError, parseJson } from "@/lib/api";
import { ApiError } from "@/lib/authz";

type Body = {
  email?: string;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(guestSessionCookieName)?.value;

    const payload = verifyGuestToken(token);
    if (!payload?.email) {
      throw new ApiError(401, "Sesión de invitado inválida o expirada.");
    }

    const orders = await prisma.order.findMany({
      where: {
        snapshotClientEmail: payload.email,
        userId: null,
      },
      include: {
        orderItems: true,
        coupon: { select: { code: true, discountType: true, discountValue: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders, email: payload.email });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJson<Body>(request);
    const email = body.email?.toLowerCase().trim();
    if (!email) throw new ApiError(400, "Email inválido");

    const count = await prisma.order.count({
      where: { snapshotClientEmail: email, userId: null },
    });
    return NextResponse.json({ hasGuestOrders: count > 0 });
  } catch (error) {
    return jsonError(error);
  }
}
