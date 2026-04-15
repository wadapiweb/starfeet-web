import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { jsonError } from "@/lib/api";

type PayoutBucket = {
  period: string;
  total: number;
  pending: number;
  validated: number;
  paid: number;
  rejected: number;
  count: number;
};

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
      select: {
        amount: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const map = new Map<string, PayoutBucket>();
    for (const entry of entries) {
      const period = entry.createdAt.toISOString().slice(0, 7);
      const bucket =
        map.get(period) ??
        {
          period,
          total: 0,
          pending: 0,
          validated: 0,
          paid: 0,
          rejected: 0,
          count: 0,
        };

      const amount = Number(entry.amount);
      bucket.total += amount;
      bucket.count += 1;
      if (entry.status === "PENDING") bucket.pending += amount;
      if (entry.status === "VALIDATED") bucket.validated += amount;
      if (entry.status === "PAID") bucket.paid += amount;
      if (entry.status === "REJECTED") bucket.rejected += amount;
      map.set(period, bucket);
    }

    const periods = Array.from(map.values()).sort((a, b) => b.period.localeCompare(a.period));
    return NextResponse.json({ periods });
  } catch (error) {
    return jsonError(error);
  }
}
