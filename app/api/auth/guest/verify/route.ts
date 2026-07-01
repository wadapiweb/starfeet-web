import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { hashAccessCode } from "@/lib/access-codes";
import { createGuestToken, guestSessionCookieName } from "@/lib/guest-session";
import { readClientIp } from "@/lib/security/rate-limit";
import { consumeGuestAccessVerifyRateLimit } from "@/lib/security/auth-rate-limit.service";
import { auditAuthEvent } from "@/lib/security/auth-audit.service";

type Body = {
  email: string;
  code: string;
};

export async function POST(request: Request) {
  try {
    const ip = readClientIp(request);
    const body = await parseJson<Body>(request);
    const email = body.email?.toLowerCase().trim();
    const code = body.code?.trim();

    if (!email || !code) {
      throw new ApiError(400, "Datos inválidos");
    }

    const rateLimit = await consumeGuestAccessVerifyRateLimit(ip, email);
    if (!rateLimit.allowed) {
      auditAuthEvent({
        action: "AUTH_RATE_LIMIT_BLOCKED",
        outcome: "blocked",
        email,
        ip,
        route: "/api/auth/guest/verify",
        reason: "too_many_guest_verify_attempts",
      });
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta nuevamente más tarde." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const codeHash = hashAccessCode(email, code, "GUEST_ACCESS");
    const accessCode = await prisma.accessCode.findFirst({
      where: {
        email,
        type: "GUEST_ACCESS",
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
          type: "GUEST_ACCESS",
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
      auditAuthEvent({
        action: "GUEST_ACCESS_CODE_REJECTED",
        outcome: "failed",
        email,
        ip,
        route: "/api/auth/guest/verify",
        reason: "invalid_or_expired_code",
      });
      throw new ApiError(400, "Código inválido o expirado");
    }

    if (accessCode.attemptCount >= accessCode.maxAttempts) {
      throw new ApiError(429, "Demasiados intentos para este código. Solicita uno nuevo.");
    }

    await prisma.accessCode.update({
      where: { id: accessCode.id },
      data: { consumedAt: new Date() },
    });

    const token = createGuestToken(email, 60 * 60);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(guestSessionCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    auditAuthEvent({
      action: "GUEST_ACCESS_GRANTED",
      outcome: "success",
      email,
      ip,
      route: "/api/auth/guest/verify",
    });

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
