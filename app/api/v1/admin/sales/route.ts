import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { requireRole } from "@/lib/authz";
import { OrderStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as OrderStatus | null;
    const search = url.searchParams.get("search")?.trim() ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = 20;

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { snapshotClientEmail: { contains: search, mode: "insensitive" as const } },
              { snapshotClientName: { contains: search, mode: "insensitive" as const } },
              { id: { contains: search } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true } },
          coupon: { select: { code: true } },
          _count: { select: { orderItems: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, pageSize });
  } catch (error) {
    return jsonError(error);
  }
}
