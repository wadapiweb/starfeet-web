import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { requireRole, ApiError } from "@/lib/authz";
import { OrderStatus } from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

type PatchOrderBody = {
  status: OrderStatus;
};

export async function PATCH(request: Request, context: Params) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const body = await parseJson<PatchOrderBody>(request);

    if (!body.status || !Object.values(OrderStatus).includes(body.status)) {
      throw new ApiError(400, "Estado de orden inválido");
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: body.status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        coupon: { select: { code: true } },
        _count: { select: { orderItems: true } },
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    return jsonError(error);
  }
}
