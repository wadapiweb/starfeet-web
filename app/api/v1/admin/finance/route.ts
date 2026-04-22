import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { requireRole } from "@/lib/authz";
import { CommissionStatus, OrderStatus } from "@prisma/client";

const RECOGNIZED_ORDER_STATUSES: OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];
const OPEN_ORDER_STATUSES: OrderStatus[] = ["INITIATED", "PENDING_PAYMENT"];

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const [
      totalOrders,
      recognizedOrders,
      openOrders,
      cancelledOrders,
      orderStatusRows,
      orderCurrencyRows,
      commissionStatusRows,
      recentCommissions,
      recentOrders,
      activeKinesios,
      activeCoupons,
      couponAssignments,
      couponRedemptions,
      couponUsageTotal,
      payoutPeriods,
      topCoupons,
      currentBalances
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { status: { in: RECOGNIZED_ORDER_STATUSES } },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { status: { in: OPEN_ORDER_STATUSES } },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { status: "CANCELLED" },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { totalAmount: true },
        orderBy: { status: "asc" },
      }),
      prisma.order.groupBy({
        by: ["currency"],
        _count: { _all: true },
        _sum: { totalAmount: true },
        orderBy: { currency: "asc" },
      }),
      prisma.commissionEntry.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { amount: true },
        orderBy: { status: "asc" },
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
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          coupon: { select: { code: true } },
          commissionEntries: { select: { id: true } },
        },
      }),
      prisma.user.count({
        where: { role: "KINESIOLOGO", isActive: true },
      }),
      prisma.coupon.count({
        where: { isActive: true },
      }),
      prisma.couponAssignment.count(),
      prisma.couponRedemption.count(),
      prisma.coupon.aggregate({
        _sum: { usageCount: true },
      }),
      prisma.$queryRawUnsafe<Array<{ count: number; amount: string }>>(
        'SELECT COUNT(*)::int AS count, COALESCE(SUM("totalAmount"), 0)::text AS amount FROM payout_periods'
      ),
      prisma.coupon.findMany({
        take: 5,
        orderBy: { usageCount: "desc" },
        include: {
          assignments: {
            select: { id: true },
          },
        },
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
            select: { amount: true },
          },
        },
      })
    ]);

    const commissionTotalsByStatus = {
      PENDING: { count: 0, amount: 0 },
      VALIDATED: { count: 0, amount: 0 },
      PAID: { count: 0, amount: 0 },
      REJECTED: { count: 0, amount: 0 },
    };

    for (const row of commissionStatusRows) {
      commissionTotalsByStatus[row.status as CommissionStatus] = {
        count: row._count._all,
        amount: Number(row._sum.amount ?? 0),
      };
    }

    const orderStatusTotals = orderStatusRows.map((row) => ({
      status: row.status,
      count: row._count._all,
      amount: Number(row._sum.totalAmount ?? 0),
    }));

    const orderCurrencyTotals = orderCurrencyRows.map((row) => ({
      currency: row.currency,
      count: row._count._all,
      amount: Number(row._sum.totalAmount ?? 0),
    }));

    const kinesioBalances = currentBalances
      .map((k) => ({
        id: k.id,
        name: k.name,
        email: k.email,
        slug: k.slug || k.id,
        pendingAmount: k.commissionEntries.reduce((sum, e) => sum + Number(e.amount), 0),
        pendingCount: k.commissionEntries.length,
      }))
      .filter((k) => k.pendingAmount > 0 || k.pendingCount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount);

    return NextResponse.json({
      cash: {
        totalAmount: Number(totalOrders._sum.totalAmount ?? 0),
        totalCount: totalOrders._count._all,
        recognizedAmount: Number(recognizedOrders._sum.totalAmount ?? 0),
        recognizedCount: recognizedOrders._count._all,
        openAmount: Number(openOrders._sum.totalAmount ?? 0),
        openCount: openOrders._count._all,
        cancelledAmount: Number(cancelledOrders._sum.totalAmount ?? 0),
        cancelledCount: cancelledOrders._count._all,
        averageTicket: totalOrders._count._all > 0 ? Number(totalOrders._sum.totalAmount ?? 0) / totalOrders._count._all : 0,
        averageRecognizedTicket: recognizedOrders._count._all > 0 ? Number(recognizedOrders._sum.totalAmount ?? 0) / recognizedOrders._count._all : 0,
      },
      summary: {
        pendingAmount: commissionTotalsByStatus.PENDING.amount + commissionTotalsByStatus.VALIDATED.amount,
        pendingCount: commissionTotalsByStatus.PENDING.count + commissionTotalsByStatus.VALIDATED.count,
        validatedAmount: commissionTotalsByStatus.VALIDATED.amount,
        validatedCount: commissionTotalsByStatus.VALIDATED.count,
        paidAmount: commissionTotalsByStatus.PAID.amount,
        paidCount: commissionTotalsByStatus.PAID.count,
        rejectedAmount: commissionTotalsByStatus.REJECTED.amount,
        rejectedCount: commissionTotalsByStatus.REJECTED.count,
        outstandingAmount: commissionTotalsByStatus.PENDING.amount + commissionTotalsByStatus.VALIDATED.amount,
        totalEntries:
          commissionTotalsByStatus.PENDING.count +
          commissionTotalsByStatus.VALIDATED.count +
          commissionTotalsByStatus.PAID.count +
          commissionTotalsByStatus.REJECTED.count,
      },
      operations: {
        activeKinesios,
        activeCoupons,
        couponAssignments,
        couponRedemptions,
        couponUsageTotal: Number(couponUsageTotal._sum.usageCount ?? 0),
        payoutPeriods: payoutPeriods[0]?.count ?? 0,
        payoutAmount: Number(payoutPeriods[0]?.amount ?? 0),
      },
      orderStatusTotals,
      orderCurrencyTotals,
      kinesioBalances,
      recentCommissions: recentCommissions.map((entry) => ({
        id: entry.id,
        amount: Number(entry.amount),
        status: entry.status,
        createdAt: entry.createdAt,
        kinesioUser: entry.kinesioUser,
        order: {
          id: entry.order.id,
          totalAmount: Number(entry.order.totalAmount),
          currency: entry.order.currency,
        },
        coupon: entry.coupon,
      })),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        status: order.status,
        currency: order.currency,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt,
        user: order.user,
        coupon: order.coupon,
        commissionCount: order.commissionEntries.length,
      })),
      topCoupons: topCoupons.map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        usageCount: coupon.usageCount,
        maxUses: coupon.maxUses,
        commissionValue: Number(coupon.commissionValue),
        assignmentsCount: coupon.assignments.length,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
