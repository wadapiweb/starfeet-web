import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, readClientIp } from "@/lib/security/rate-limit";
import { auditSecurityEvent } from "@/lib/security/audit";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/api/auth/callback/credentials") {
    const ip = readClientIp(request);
    const rateLimit = consumeRateLimit(`auth:credentials-callback:${ip}`, {
      windowMs: 10 * 60 * 1000,
      max: 20,
    });

    if (!rateLimit.allowed) {
      auditSecurityEvent({
        action: "AUTH_RATE_LIMIT_BLOCKED",
        ip,
        route: pathname,
        reason: "too_many_credentials_attempts",
        provider: "credentials",
      });

      return NextResponse.json(
        { error: "Demasiados intentos de login. Intenta nuevamente más tarde." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/callback/credentials"],
};
