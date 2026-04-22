import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { jsonError } from "@/lib/api";
import { CommissionStatus } from "@prisma/client";

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

    const [patientsCount, commissions, couponUsage] = await Promise.all([
      prisma.patientKinesioLink.count({
        where: {
          kinesioUserId: user.id,
          ...(dateFilter ? { linkedAt: dateFilter } : {}),
        },
      }),
      prisma.commissionEntry.aggregate({
        where: {
          kinesioUserId: user.id,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.couponRedemption.count({
        where: {
          coupon: {
            assignments: {
              some: { kinesioUserId: user.id },
            },
          },
          ...(dateFilter ? { usedAt: dateFilter } : {}),
        },
      }),
    ]);

    const byStatus = await prisma.commissionEntry.groupBy({
      by: ["status"],
      where: {
        kinesioUserId: user.id,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      _count: { _all: true },
    });

    const statusMap: Record<CommissionStatus, number> = {
      PENDING: 0,
      VALIDATED: 0,
      PAID: 0,
      REJECTED: 0,
    };

    for (const row of byStatus) {
      statusMap[row.status] = row._count._all;
    }

    return NextResponse.json({
      patientsCount,
      couponUsage,
      commissionsCount: commissions._count._all,
      commissionsTotal: commissions._sum.amount ?? 0,
      commissionByStatus: statusMap,
    });
  } catch (error) {
    return jsonError(error);
  }
}
