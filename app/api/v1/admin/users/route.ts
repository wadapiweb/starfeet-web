import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { ApiError, requireRole } from "@/lib/authz";
import { listAdminUsers } from "@/lib/admin-users";

const querySchema = z.object({
  q: z.string().trim().optional(),
  role: z.enum(["all", "CLIENTE", "KINESIOLOGO", "ADMIN", "MARKETING"]).optional(),
  status: z.enum(["all", "active", "inactive", "blocked"]).optional(),
  purchases: z.enum(["all", "yes", "no"]).optional(),
  sort: z.enum(["createdAt", "lastLoginAt", "email", "orders"]).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const url = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      throw new ApiError(400, "Filtros inválidos");
    }
    const query = parsed.data;
    const payload = await listAdminUsers({
      ...query,
      role: query.role as Role | "all" | undefined,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return jsonError(error);
  }
}
