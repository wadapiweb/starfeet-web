import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { hashAccessCode } from "@/lib/access-codes";
import { readClientIp } from "@/lib/security/rate-limit";
import { consumePasswordResetVerifyRateLimit } from "@/lib/security/auth-rate-limit.service";
import { auditAuthEvent } from "@/lib/security/auth-audit.service";
import { getAdminSecuritySettings } from "@/lib/admin-settings.server";

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
    const securitySettings = await getAdminSecuritySettings();

    if (!email || !code || !password || password.length < securitySettings.minPasswordLength) {
      throw new ApiError(
        400,
        `Datos inválidos. La contraseña debe tener al menos ${securitySettings.minPasswordLength} caracteres.`,
      );
    }

    const rateLimit = await consumePasswordResetVerifyRateLimit(ip, email);
    if (!rateLimit.allowed) {
      auditAuthEvent({
        action: "AUTH_RATE_LIMIT_BLOCKED",
        outcome: "blocked",
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
      await prisma.accessCode.updateMany({
        where: {
          email,
          type: "PASSWORD_RESET",
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
      auditAuthEvent({
        action: "PASSWORD_RESET_CODE_REJECTED",
        outcome: "failed",
        email,
        ip,
        route: "/api/auth/reset-password",
        reason: "invalid_or_expired_code",
      });
      throw new ApiError(400, "Código inválido o expirado.");
    }

    if (accessCode.attemptCount >= accessCode.maxAttempts) {
      throw new ApiError(429, "Demasiados intentos para este código. Solicita uno nuevo.");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(404, "Usuario no encontrado.");
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashed,
          isActive: true,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockoutUntil: null,
          sessionVersion: { increment: 1 },
        },
      }),
      prisma.accessCode.update({
        where: { id: accessCode.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    auditAuthEvent({
      action: "PASSWORD_RESET_SUCCEEDED",
      outcome: "success",
      actorUserId: user.id,
      actorRole: user.role,
      email,
      ip,
      route: "/api/auth/reset-password",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
