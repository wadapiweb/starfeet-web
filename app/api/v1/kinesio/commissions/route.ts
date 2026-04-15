import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { jsonError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["KINESIOLOGO"]);
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const dateFilter =
      from && to
        ? {
            gte: new Date(from),
            lte: new Date(to),
          }
        : undefined;

    const entries = await prisma.commissionEntry.findMany({
      where: {
        kinesioUserId: user.id,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      include: {
        coupon: { select: { code: true } },
        order: { select: { id: true, status: true, snapshotClientEmail: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ commissions: entries });
  } catch (error) {
    return jsonError(error);
  }
}
