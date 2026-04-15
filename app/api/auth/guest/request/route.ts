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

    const rateLimit = consumeRateLimit(`auth:guest-request:${ip}:${normalizedEmail}`, {
      windowMs: 15 * 60 * 1000,
      max: 6,
    });
    if (!rateLimit.allowed) {
      auditSecurityEvent({
        action: "AUTH_RATE_LIMIT_BLOCKED",
        email: normalizedEmail,
        ip,
        route: "/api/auth/guest/request",
        reason: "too_many_guest_code_requests",
      });
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta nuevamente más tarde." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const hasGuestOrders = await prisma.order.count({
      where: {
        snapshotClientEmail: normalizedEmail,
        userId: null,
      },
    });

    if (hasGuestOrders === 0) {
      return NextResponse.json({ ok: true });
    }

    const code = generateCode();
    const codeHash = hashAccessCode(normalizedEmail, code, "GUEST_ACCESS");
    const expiresAt = getAccessCodeExpiry();

    await prisma.accessCode.create({
      data: {
        email: normalizedEmail,
        type: "GUEST_ACCESS",
        codeHash,
        expiresAt,
      },
    });

    auditSecurityEvent({
      action: "GUEST_ACCESS_CODE_REQUESTED",
      email: normalizedEmail,
      ip,
      route: "/api/auth/guest/request",
    });

    const sent = await sendMail({
      to: normalizedEmail,
      subject: "Acceso a compras de invitado - Starfeet",
      html: `<p>Tu código de acceso es <strong>${code}</strong>.</p><p>Expira en 15 minutos.</p>`,
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
