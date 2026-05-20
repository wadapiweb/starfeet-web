import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError, requireRole } from "@/lib/authz";
import bcrypt from "bcryptjs";
import { generateUniqueUserSlug } from "@/lib/slug";
import { getAdminSecuritySettings } from "@/lib/admin-settings.server";

type Params = {
  params: Promise<{ id: string }>;
};

type PatchProfessionalBody = {
  name?: string | null;
  email?: string;
  phone?: string | null;
  password?: string;
  isActive?: boolean;
};

export async function PATCH(request: Request, context: Params) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const body = await parseJson<PatchProfessionalBody>(request);
    const securitySettings = await getAdminSecuritySettings();

    const professional = await prisma.user.findFirst({
      where: { id, role: "KINESIOLOGO" },
      select: { id: true, name: true, email: true },
    });
    if (!professional) {
      throw new ApiError(404, "Profesional no encontrado");
    }

    const data: {
      name?: string | null;
      email?: string;
      phone?: string | null;
      password?: string;
      isActive?: boolean;
      slug?: string;
    } = {};

    const nextName = body.name !== undefined ? body.name?.trim() || null : professional.name;
    const nextEmail = body.email?.toLowerCase().trim() ?? professional.email;

    if (body.email !== undefined) {
      if (!nextEmail) {
        throw new ApiError(400, "Email requerido");
      }
      const existing = await prisma.user.findUnique({
        where: { email: nextEmail },
        select: { id: true },
      });
      if (existing && existing.id !== id) {
        throw new ApiError(409, "Ya existe un usuario con ese email");
      }
      data.email = nextEmail;
    }

    if (body.name !== undefined) data.name = nextName;
    if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    if (body.password !== undefined) {
      const password = body.password.trim();
      if (password.length < securitySettings.minPasswordLength) {
        throw new ApiError(
          400,
          `La contraseña debe tener al menos ${securitySettings.minPasswordLength} caracteres`,
        );
      }
      data.password = await bcrypt.hash(password, 10);
    }

    if (body.name !== undefined || body.email !== undefined) {
      data.slug = await generateUniqueUserSlug(nextName, nextEmail, id);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ professional: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_: Request, context: Params) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;

    const professional = await prisma.user.findFirst({
      where: { id, role: "KINESIOLOGO" },
      select: { id: true, isActive: true },
    });
    if (!professional) {
      throw new ApiError(404, "Profesional no encontrado");
    }

    if (!professional.isActive) {
      return NextResponse.json({ ok: true, mode: "already_inactive" });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true, mode: "deactivated" });
  } catch (error) {
    return jsonError(error);
  }
}
