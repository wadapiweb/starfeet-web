import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJson } from "@/lib/api";
import { ApiError, requireRole } from "@/lib/authz";
import { getAdminUserDetail, patchAdminUser } from "@/lib/admin-users";

type Params = {
  params: Promise<{ id: string }>;
};

const patchSchema = z.object({
  name: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  documentNumber: z.string().trim().nullable().optional(),
  role: z.enum(["CLIENTE", "KINESIOLOGO", "ADMIN", "MARKETING"]).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_: Request, context: Params) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const detail = await getAdminUserDetail(id);
    if (!detail) throw new ApiError(404, "Usuario no encontrado");

    return NextResponse.json(detail);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: Params) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const body = await parseJson<unknown>(request);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "Datos inválidos");
    }

    const user = await patchAdminUser(admin, id, parsed.data);
    return NextResponse.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}
