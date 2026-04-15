import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { hashAccessCode } from "@/lib/access-codes";

type Body = {
  email: string;
  code: string;
  password: string;
};

export async function POST(request: Request) {
  try {
    const body = await parseJson<Body>(request);
    const email = body.email?.toLowerCase().trim();
    const code = body.code?.trim();
    const password = body.password?.trim();

    if (!email || !code || !password || password.length < 6) {
      throw new ApiError(400, "Datos inválidos.");
    }

    const codeHash = hashAccessCode(email, code, "PASSWORD_RESET");
    const accessCode = await prisma.accessCode.findFirst({
      where: {
        email,
        type: "PASSWORD_RESET",
        codeHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!accessCode) {
      throw new ApiError(400, "Código inválido o expirado.");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(404, "Usuario no encontrado.");
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashed, isActive: true },
      }),
      prisma.accessCode.update({
        where: { id: accessCode.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
