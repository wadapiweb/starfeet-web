import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { generateCode, getAccessCodeExpiry, hashAccessCode } from "@/lib/access-codes";
import { sendMail } from "@/lib/mailer";
import { readClientIp } from "@/lib/security/rate-limit";
import { consumePasswordResetRequestRateLimit } from "@/lib/security/auth-rate-limit.service";
import { auditAuthEvent } from "@/lib/security/auth-audit.service";

type Body = { email: string };

export async function POST(request: Request) {
  try {
    const ip = readClientIp(request);
    const { email } = await parseJson<Body>(request);
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail) {
      throw new ApiError(400, "Email inválido");
    }

    const rateLimit = await consumePasswordResetRequestRateLimit(ip, normalizedEmail);
    if (!rateLimit.allowed) {
      auditAuthEvent({
        action: "AUTH_RATE_LIMIT_BLOCKED",
        outcome: "blocked",
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

    await prisma.$transaction([
      prisma.accessCode.updateMany({
        where: {
          email: normalizedEmail,
          type: "PASSWORD_RESET",
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      }),
      prisma.accessCode.create({
        data: {
          email: normalizedEmail,
          userId: user.id,
          type: "PASSWORD_RESET",
          codeHash,
          expiresAt,
        },
      }),
    ]);

    auditAuthEvent({
      action: "PASSWORD_RESET_CODE_REQUESTED",
      outcome: "success",
      actorUserId: user.id,
      actorRole: user.role,
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
