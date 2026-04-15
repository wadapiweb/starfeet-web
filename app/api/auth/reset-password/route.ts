import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { hashAccessCode } from "@/lib/access-codes";
import { consumeRateLimit, readClientIp } from "@/lib/security/rate-limit";
import { auditSecurityEvent } from "@/lib/security/audit";

type Body = {
  email: string;
  code: string;
  password: string;
};

export async function POST(request: Request) {
  try {
    const ip = readClientIp(request);
    const body = await parseJson<Body>(request);
    const email = body.email?.toLowerCase().trim();
    const code = body.code?.trim();
    const password = body.password?.trim();

    if (!email || !code || !password || password.length < 6) {
      throw new ApiError(400, "Datos inválidos.");
    }

    const rateLimit = consumeRateLimit(`auth:reset-password:${ip}:${email}`, {
      windowMs: 15 * 60 * 1000,
      max: 10,
    });
    if (!rateLimit.allowed) {
      auditSecurityEvent({
        action: "AUTH_RATE_LIMIT_BLOCKED",
        email,
        ip,
        route: "/api/auth/reset-password",
        reason: "too_many_reset_attempts",
      });
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta nuevamente más tarde." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
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
      auditSecurityEvent({
        action: "PASSWORD_RESET_CODE_REJECTED",
        email,
        ip,
        route: "/api/auth/reset-password",
        reason: "invalid_or_expired_code",
      });
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

    auditSecurityEvent({
      action: "PASSWORD_RESET_SUCCEEDED",
      email,
      ip,
      route: "/api/auth/reset-password",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
