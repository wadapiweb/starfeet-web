import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, ApiError } from "@/lib/authz";
import { jsonError } from "@/lib/api";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Params) {
  try {
    const user = await requireRole(["CLIENTE"]);
    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, "Orden no encontrada");
    }
    if (order.userId !== user.id) {
      throw new ApiError(403, "No tenés permisos para ver esta orden");
    }

    return NextResponse.json({ order });
  } catch (error) {
    return jsonError(error);
  }
}
