import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireRole } from "@/lib/authz";
import { sendAdminPasswordReset } from "@/lib/admin-users";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: Params) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const payload = await sendAdminPasswordReset(admin, id);

    return NextResponse.json(payload);
  } catch (error) {
    return jsonError(error);
  }
}
