import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { requireRole, ApiError } from "@/lib/authz";
import { DiscountType } from "@prisma/client";
import { generateUniqueCouponSlug } from "@/lib/slug";

type CreateCouponBody = {
  code: string;
  discountValue: number;
  discountType: DiscountType;
  maxUses: number;
  expiresAt: string;
  isStackable?: boolean;
  commissionType: DiscountType;
  commissionValue: number;
  kinesioUserIds?: string[];
};

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const code = url.searchParams.get("code");
    const kinesioUserId = url.searchParams.get("kinesioUserId");

    const coupons = await prisma.coupon.findMany({
      where: {
        ...(status === "active" ? { isActive: true } : {}),
        ...(status === "inactive" ? { isActive: false } : {}),
        ...(code ? { code: { contains: code.trim().toUpperCase() } } : {}),
        ...(kinesioUserId
          ? {
              assignments: {
                some: { kinesioUserId },
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
          include: {
            kinesioUser: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const body = await parseJson<CreateCouponBody>(request);

    if (!body.code || body.discountValue <= 0 || body.maxUses <= 0 || body.commissionValue < 0) {
      throw new ApiError(400, "Parámetros inválidos para crear cupón");
    }

    const expiresAt = new Date(body.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new ApiError(400, "expiresAt inválido");
    }

    const kinesioIds = body.kinesioUserIds ?? [];
    if (kinesioIds.length > 0) {
      const kinesios = await prisma.user.count({
        where: { id: { in: kinesioIds }, role: "KINESIOLOGO", isActive: true },
      });
      if (kinesios !== kinesioIds.length) {
        throw new ApiError(400, "Hay kinesiólogos inválidos en la asignación");
      }
    }

    const code = body.code.trim().toUpperCase();
    const slug = await generateUniqueCouponSlug(code);

    const coupon = await prisma.coupon.create({
      data: {
        slug,
        code,
        discountValue: body.discountValue,
        discountType: body.discountType,
        maxUses: body.maxUses,
        expiresAt,
        isStackable: Boolean(body.isStackable),
        commissionType: body.commissionType,
        commissionValue: body.commissionValue,
        createdById: admin.id,
        assignments: {
          create: kinesioIds.map((kinesioUserId) => ({
            kinesioUserId,
            assignedById: admin.id,
          })),
        },
      },
      include: {
        assignments: true,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
