import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, readClientIp } from "@/lib/security/rate-limit";
import { auditSecurityEvent } from "@/lib/security/audit";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const host = request.headers.get("host") || "";

  // 1. Rate Limiting Check (originally in proxy.ts)
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
    return NextResponse.next();
  }

  // Exclude static assets, public assets, global auth routes, and other API routes from subdomain routing
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/recuperar") ||
    pathname.startsWith("/post-login") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Subdomain Routing Logic
  const cleanHost = host.split(":")[0];

  // Map subdomains to their respective App Router folders
  if (cleanHost.startsWith("tienda.")) {
    url.pathname = `/tienda${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  if (cleanHost.startsWith("kine.")) {
    url.pathname = `/kinesio${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  if (cleanHost.startsWith("dashboard.")) {
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Intercept all requests except static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
