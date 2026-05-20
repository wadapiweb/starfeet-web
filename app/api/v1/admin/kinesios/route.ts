import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { ApiError, requireRole } from "@/lib/authz";
import bcrypt from "bcryptjs";
import { generateUniqueUserSlug } from "@/lib/slug";
import { getAdminSecuritySettings } from "@/lib/admin-settings.server";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const kinesios = await prisma.user.findMany({
      where: { role: "KINESIOLOGO", isActive: true },
      select: { id: true, slug: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ professionals: kinesios, kinesios });
  } catch (error) {
    return jsonError(error);
  }
}

type CreateProfessionalBody = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
};

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const securitySettings = await getAdminSecuritySettings();

    const body = (await request.json()) as CreateProfessionalBody;
    const email = body.email?.toLowerCase().trim();
    const password = body.password?.trim();
    const name = body.name?.trim() || null;
    const phone = body.phone?.trim() || null;

    if (!email) {
      throw new ApiError(400, "Email requerido");
    }
    if (!password || password.length < securitySettings.minPasswordLength) {
      throw new ApiError(
        400,
        `La contraseña debe tener al menos ${securitySettings.minPasswordLength} caracteres`,
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, "Ya existe un usuario con ese email");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const slug = await generateUniqueUserSlug(name, email);
    const professional = await prisma.user.create({
      data: {
        slug,
        name,
        email,
        phone,
        password: hashedPassword,
        role: "KINESIOLOGO",
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ professional }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
