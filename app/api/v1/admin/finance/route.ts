import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { requireRole } from "@/lib/authz";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    // Raw aggregations to fetch overall finance metrics
    const [
      pendingCommissions,
      paidCommissions,
      recentCommissions,
      kinesioCommissions
    ] = await Promise.all([
      prisma.commissionEntry.aggregate({
        where: { status: { in: ["PENDING", "VALIDATED"] } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.commissionEntry.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.commissionEntry.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          kinesioUser: { select: { name: true, email: true } },
          order: { select: { id: true, totalAmount: true, currency: true } },
          coupon: { select: { code: true } }
        }
      }),
      prisma.user.findMany({
        where: { role: "KINESIOLOGO", isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          slug: true,
          commissionEntries: {
            where: { status: { in: ["PENDING", "VALIDATED"] } },
            select: { amount: true }
          }
        }
      })
    ]);

    const kinesioBalances = kinesioCommissions.map(k => ({
      id: k.id,
      name: k.name,
      email: k.email,
      slug: k.slug || k.id,
      pendingAmount: k.commissionEntries.reduce((sum, e) => sum + Number(e.amount), 0),
      pendingCount: k.commissionEntries.length
    })).sort((a, b) => b.pendingAmount - a.pendingAmount);

    return NextResponse.json({
      summary: {
        pendingAmount: Number(pendingCommissions._sum.amount || 0),
        pendingCount: pendingCommissions._count._all,
        paidAmount: Number(paidCommissions._sum.amount || 0),
        paidCount: paidCommissions._count._all,
      },
      kinesioBalances,
      recentCommissions
    });
  } catch (error) {
    return jsonError(error);
  }
}
