import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { jsonError } from "@/lib/api";

function csvEscape(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

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
        order: { select: { id: true, status: true, snapshotClientEmail: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "commission_id",
      "created_at",
      "status",
      "amount",
      "coupon_code",
      "order_id",
      "order_status",
      "client_email",
    ];

    const lines = [
      headers.join(","),
      ...entries.map((entry) =>
        [
          csvEscape(entry.id),
          csvEscape(entry.createdAt.toISOString()),
          csvEscape(entry.status),
          csvEscape(Number(entry.amount).toFixed(2)),
          csvEscape(entry.coupon?.code ?? ""),
          csvEscape(entry.order.id),
          csvEscape(entry.order.status),
          csvEscape(entry.order.snapshotClientEmail ?? ""),
        ].join(","),
      ),
    ];

    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kinesio-commissions-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
