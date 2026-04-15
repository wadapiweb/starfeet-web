import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { jsonError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireRole(["KINESIOLOGO"]);

    const assignments = await prisma.couponAssignment.findMany({
      where: { kinesioUserId: user.id },
      orderBy: { assignedAt: "desc" },
      include: {
        coupon: {
          include: {
            _count: {
              select: { redemptions: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    return jsonError(error);
  }
}
