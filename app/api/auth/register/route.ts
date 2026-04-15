import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";

type Body = {
  email: string;
  password: string;
  name?: string;
};

export async function POST(request: Request) {
  try {
    const body = await parseJson<Body>(request);
    const email = body.email?.toLowerCase().trim();
    const password = body.password?.trim();
    const name = body.name?.trim() || null;

    if (!email || !password || password.length < 6) {
      throw new ApiError(400, "Datos inválidos. La contraseña debe tener al menos 6 caracteres.");
    }

    const hashed = await bcrypt.hash(password, 10);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (!existing) {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashed,
          name,
          role: "CLIENTE",
          isActive: true,
        },
      });
      return NextResponse.json({ userId: user.id }, { status: 201 });
    }

    if (!existing.isActive) {
      throw new ApiError(403, "Usuario inactivo");
    }

    if (existing.password) {
      throw new ApiError(409, "Ese email ya tiene una cuenta con contraseña.");
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hashed,
        ...(name ? { name } : {}),
      },
    });

    return NextResponse.json({ userId: user.id, linkedGoogleAccount: true });
  } catch (error) {
    return jsonError(error);
  }
}
