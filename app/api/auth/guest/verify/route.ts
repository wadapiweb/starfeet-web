import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { hashAccessCode } from "@/lib/access-codes";
import { createGuestToken, guestSessionCookieName } from "@/lib/guest-session";
import { consumeRateLimit, readClientIp } from "@/lib/security/rate-limit";
import { auditSecurityEvent } from "@/lib/security/audit";

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

    const rateLimit = consumeRateLimit(`auth:guest-verify:${ip}:${email}`, {
      windowMs: 15 * 60 * 1000,
      max: 10,
    });
    if (!rateLimit.allowed) {
      auditSecurityEvent({
        action: "AUTH_RATE_LIMIT_BLOCKED",
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
      auditSecurityEvent({
        action: "GUEST_ACCESS_CODE_REJECTED",
        email,
        ip,
        route: "/api/auth/guest/verify",
        reason: "invalid_or_expired_code",
      });
      throw new ApiError(400, "Código inválido o expirado");
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

    auditSecurityEvent({
      action: "GUEST_ACCESS_GRANTED",
      email,
      ip,
      route: "/api/auth/guest/verify",
    });

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
