import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { requireRole } from "@/lib/authz";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const kinesios = await prisma.user.findMany({
      where: { role: "KINESIOLOGO", isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ kinesios });
  } catch (error) {
    return jsonError(error);
  }
}
