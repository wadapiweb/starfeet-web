import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { requireRole, ApiError } from "@/lib/authz";

type AssignmentBody = {
  kinesioUserIds: string[];
};

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Params) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const body = await parseJson<AssignmentBody>(request);

    if (!Array.isArray(body.kinesioUserIds) || body.kinesioUserIds.length === 0) {
      throw new ApiError(400, "kinesioUserIds es requerido");
    }

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new ApiError(404, "Cupón no encontrado");
    }

    const validKinesios = await prisma.user.findMany({
      where: { id: { in: body.kinesioUserIds }, role: "KINESIOLOGO", isActive: true },
      select: { id: true },
    });

    if (validKinesios.length !== body.kinesioUserIds.length) {
      throw new ApiError(400, "Hay kinesiólogos inválidos");
    }

    await prisma.couponAssignment.createMany({
      data: validKinesios.map((k) => ({
        couponId: id,
        kinesioUserId: k.id,
        assignedById: admin.id,
      })),
      skipDuplicates: true,
    });

    const assignments = await prisma.couponAssignment.findMany({
      where: { couponId: id },
      include: { kinesioUser: { select: { id: true, name: true, email: true } } },
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json({ couponId: id, assignments });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: Params) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const body = await parseJson<AssignmentBody>(request);

    if (!Array.isArray(body.kinesioUserIds) || body.kinesioUserIds.length === 0) {
      throw new ApiError(400, "kinesioUserIds es requerido");
    }

    await prisma.couponAssignment.deleteMany({
      where: {
        couponId: id,
        kinesioUserId: { in: body.kinesioUserIds },
      },
    });

    const assignments = await prisma.couponAssignment.findMany({
      where: { couponId: id },
      include: { kinesioUser: { select: { id: true, name: true, email: true } } },
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json({ couponId: id, assignments });
  } catch (error) {
    return jsonError(error);
  }
}
