import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { requireRole, ApiError } from "@/lib/authz";

type Params = {
  params: Promise<{ id: string }>;
};

type PatchCouponBody = {
  isActive?: boolean;
  maxUses?: number;
  expiresAt?: string;
  isStackable?: boolean;
};

export async function PATCH(request: Request, context: Params) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const body = await parseJson<PatchCouponBody>(request);

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new ApiError(404, "Cupón no encontrado");
    }

    const data: {
      isActive?: boolean;
      maxUses?: number;
      expiresAt?: Date;
      isStackable?: boolean;
    } = {};

    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.isStackable === "boolean") data.isStackable = body.isStackable;
    if (typeof body.maxUses === "number") {
      if (body.maxUses < coupon.usageCount) {
        throw new ApiError(400, "maxUses no puede ser menor al usageCount actual");
      }
      data.maxUses = body.maxUses;
    }
    if (body.expiresAt) {
      const date = new Date(body.expiresAt);
      if (Number.isNaN(date.getTime())) {
        throw new ApiError(400, "expiresAt inválido");
      }
      data.expiresAt = date;
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data,
      include: {
        assignments: {
          include: {
            kinesioUser: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ coupon: updated });
  } catch (error) {
    return jsonError(error);
  }
}
