import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { generateCode, getAccessCodeExpiry, hashAccessCode } from "@/lib/access-codes";
import { sendMail } from "@/lib/mailer";
import { consumeRateLimit, readClientIp } from "@/lib/security/rate-limit";
import { auditSecurityEvent } from "@/lib/security/audit";

type Body = { email: string };

export async function POST(request: Request) {
  try {
    const ip = readClientIp(request);
    const { email } = await parseJson<Body>(request);
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail) {
      throw new ApiError(400, "Email inválido");
    }

    const rateLimit = consumeRateLimit(`auth:forgot-password:${ip}:${normalizedEmail}`, {
      windowMs: 15 * 60 * 1000,
      max: 6,
    });
    if (!rateLimit.allowed) {
      auditSecurityEvent({
        action: "AUTH_RATE_LIMIT_BLOCKED",
        email: normalizedEmail,
        ip,
        route: "/api/auth/forgot-password",
        reason: "too_many_reset_code_requests",
      });
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta nuevamente más tarde." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.isActive) {
      return NextResponse.json({ ok: true });
    }

    const code = generateCode();
    const codeHash = hashAccessCode(normalizedEmail, code, "PASSWORD_RESET");
    const expiresAt = getAccessCodeExpiry();

    await prisma.accessCode.create({
      data: {
        email: normalizedEmail,
        userId: user.id,
        type: "PASSWORD_RESET",
        codeHash,
        expiresAt,
      },
    });

    auditSecurityEvent({
      action: "PASSWORD_RESET_CODE_REQUESTED",
      email: normalizedEmail,
      ip,
      route: "/api/auth/forgot-password",
    });

    const sent = await sendMail({
      to: normalizedEmail,
      subject: "Recuperación de contraseña - Starfeet",
      html: `<p>Tu código de recuperación es <strong>${code}</strong>.</p><p>Expira en 15 minutos.</p>`,
    });

    return NextResponse.json({
      ok: true,
      ...(sent.sent
        ? {}
        : process.env.NODE_ENV !== "production"
          ? { devCode: code }
          : {}),
    });
  } catch (error) {
    return jsonError(error);
  }
}
