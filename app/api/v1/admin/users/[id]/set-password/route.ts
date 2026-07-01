import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJson } from "@/lib/api";
import { ApiError, requireRole } from "@/lib/authz";
import { setAdminUserPassword } from "@/lib/admin-users";
import { getAdminSecuritySettings } from "@/lib/admin-settings.server";

type Params = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  password: z.string(),
});

export async function POST(request: Request, context: Params) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const body = await parseJson<unknown>(request);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Datos inválidos");

    const settings = await getAdminSecuritySettings();
    const password = parsed.data.password.trim();
    if (password.length < settings.minPasswordLength) {
      throw new ApiError(400, `La contraseña debe tener al menos ${settings.minPasswordLength} caracteres`);
    }

    const payload = await setAdminUserPassword(admin, id, password);
    return NextResponse.json(payload);
  } catch (error) {
    return jsonError(error);
  }
}
