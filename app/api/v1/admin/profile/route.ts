import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { requireSessionUser, ApiError } from "@/lib/authz";
import bcrypt from "bcryptjs";
import { getAdminSecuritySettings } from "@/lib/admin-settings.server";

type PatchProfileBody = {
  name?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
};

export async function GET() {
  try {
    const userSession = await requireSessionUser();

    const user = await prisma.user.findUnique({
      where: { id: userSession.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) throw new ApiError(404, "Usuario no encontrado");

    return NextResponse.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const userSession = await requireSessionUser();
    const body = await parseJson<PatchProfileBody>(request);
    const securitySettings = await getAdminSecuritySettings();

    const currentUser = await prisma.user.findUnique({ where: { id: userSession.id } });
    if (!currentUser) throw new ApiError(404, "Usuario no encontrado");

    const data: { name?: string; phone?: string; password?: string } = {};

    if (body.name !== undefined) data.name = body.name.trim() || undefined;
    if (body.phone !== undefined) data.phone = body.phone.trim();

    if (body.currentPassword && body.newPassword) {
      if (!currentUser.password) {
        throw new ApiError(400, "Este usuario no tiene contraseña registrada, inicia sesión por proveedor externo.");
      }
      
      const isValid = await bcrypt.compare(body.currentPassword, currentUser.password);
      if (!isValid) throw new ApiError(400, "La contraseña actual es incorrecta");

      if (body.newPassword.length < securitySettings.minPasswordLength) {
        throw new ApiError(
          400,
          `La nueva contraseña debe tener al menos ${securitySettings.minPasswordLength} caracteres`,
        );
      }

      data.password = await bcrypt.hash(body.newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userSession.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    return jsonError(error);
  }
}
