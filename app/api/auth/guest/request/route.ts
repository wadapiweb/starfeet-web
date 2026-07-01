import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { generateCode, getAccessCodeExpiry, hashAccessCode } from "@/lib/access-codes";
import { sendMail } from "@/lib/mailer";
import { readClientIp } from "@/lib/security/rate-limit";
import { consumeGuestAccessRequestRateLimit } from "@/lib/security/auth-rate-limit.service";
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

    const rateLimit = await consumeGuestAccessRequestRateLimit(ip, normalizedEmail);
    if (!rateLimit.allowed) {
      auditAuthEvent({
        action: "AUTH_RATE_LIMIT_BLOCKED",
        outcome: "blocked",
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

    await prisma.$transaction([
      prisma.accessCode.updateMany({
        where: {
          email: normalizedEmail,
          type: "GUEST_ACCESS",
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      }),
      prisma.accessCode.create({
        data: {
          email: normalizedEmail,
          type: "GUEST_ACCESS",
          codeHash,
          expiresAt,
        },
      }),
    ]);

    auditAuthEvent({
      action: "GUEST_ACCESS_CODE_REQUESTED",
      outcome: "success",
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
