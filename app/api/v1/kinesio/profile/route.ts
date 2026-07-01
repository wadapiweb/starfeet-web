import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { requireSessionUser, ApiError } from "@/lib/authz";
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
        slug: true,
        image: true,
        isActive: true,
        createdAt: true,
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

    const data: {
      name?: string | null;
      phone?: string | null;
      password?: string;
      passwordChangedAt?: Date;
      sessionVersion?: { increment: number };
    } = {};

    if (body.name !== undefined) data.name = body.name.trim() || null;
    if (body.phone !== undefined) data.phone = body.phone.trim() || null;

    if (body.currentPassword || body.newPassword) {
      if (!body.currentPassword || !body.newPassword) {
        throw new ApiError(400, "Debes completar la contraseña actual y la nueva");
      }
      if (!currentUser.password) {
        throw new ApiError(400, "Este usuario no tiene contraseña registrada");
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
      data.passwordChangedAt = new Date();
      data.sessionVersion = { increment: 1 };
    }

    const updated = await prisma.user.update({
      where: { id: userSession.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        slug: true,
        image: true,
        isActive: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    return jsonError(error);
  }
}
