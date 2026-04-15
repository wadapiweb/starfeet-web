import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { jsonError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireRole(["CLIENTE"]);

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        orderItems: true,
        coupon: { select: { id: true, code: true, discountType: true, discountValue: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return jsonError(error);
  }
}
