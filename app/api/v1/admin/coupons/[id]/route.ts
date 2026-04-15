import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { requireRole, ApiError } from "@/lib/authz";

type Params = {
  params: Promise<{ id: string }>;
};

type PatchCouponBody = {
  code?: string;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue?: number;
  commissionType?: "PERCENTAGE" | "FIXED_AMOUNT";
  commissionValue?: number;
  isActive?: boolean;
  maxUses?: number;
  expiresAt?: string;
  isStackable?: boolean;
  kinesioUserIds?: string[];
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
      code?: string;
      discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
      discountValue?: number;
      commissionType?: "PERCENTAGE" | "FIXED_AMOUNT";
      commissionValue?: number;
      isActive?: boolean;
      maxUses?: number;
      expiresAt?: Date;
      isStackable?: boolean;
    } = {};

    if (body.code !== undefined) {
      const nextCode = body.code.trim().toUpperCase();
      if (nextCode.length < 3) {
        throw new ApiError(400, "Código inválido");
      }
      const existing = await prisma.coupon.findUnique({
        where: { code: nextCode },
        select: { id: true },
      });
      if (existing && existing.id !== id) {
        throw new ApiError(409, "Ya existe un cupón con ese código");
      }
      data.code = nextCode;
    }

    if (body.discountType) data.discountType = body.discountType;
    if (body.discountValue !== undefined) {
      if (body.discountValue <= 0) throw new ApiError(400, "discountValue inválido");
      data.discountValue = body.discountValue;
    }
    if (body.commissionType) data.commissionType = body.commissionType;
    if (body.commissionValue !== undefined) {
      if (body.commissionValue < 0) throw new ApiError(400, "commissionValue inválido");
      data.commissionValue = body.commissionValue;
    }
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

    if (body.kinesioUserIds) {
      const kinesioIds = Array.from(new Set(body.kinesioUserIds));
      const validCount = await prisma.user.count({
        where: {
          id: { in: kinesioIds },
          role: "KINESIOLOGO",
          isActive: true,
        },
      });
      if (validCount !== kinesioIds.length) {
        throw new ApiError(400, "Hay profesionales inválidos en la asignación");
      }

      const existingAssignments = await prisma.couponAssignment.findMany({
        where: { couponId: id },
        select: { kinesioUserId: true },
      });
      const existingSet = new Set(existingAssignments.map((item) => item.kinesioUserId));
      const incomingSet = new Set(kinesioIds);

      const toCreate = kinesioIds.filter((kinesioUserId) => !existingSet.has(kinesioUserId));
      const toDelete = [...existingSet].filter((kinesioUserId) => !incomingSet.has(kinesioUserId));

      if (toCreate.length > 0) {
        await prisma.couponAssignment.createMany({
          data: toCreate.map((kinesioUserId) => ({
            couponId: id,
            kinesioUserId,
          })),
          skipDuplicates: true,
        });
      }

      if (toDelete.length > 0) {
        await prisma.couponAssignment.deleteMany({
          where: { couponId: id, kinesioUserId: { in: toDelete } },
        });
      }
    }

    const refreshed = await prisma.coupon.findUniqueOrThrow({
      where: { id },
      include: {
        assignments: {
          include: {
            kinesioUser: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ coupon: refreshed ?? updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_: Request, context: Params) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;

    try {
      await prisma.coupon.delete({ where: { id } });
      return NextResponse.json({ ok: true, mode: "deleted" });
    } catch {
      await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ ok: true, mode: "deactivated" });
    }
  } catch (error) {
    return jsonError(error);
  }
}
