import { NextResponse } from "next/server";
import { applyCredentialCorsHeaders } from "@/lib/security/origin";

export async function POST(request: Request) {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || ".starfeet.ar";
  const origin = request.headers.get("origin");
  const headers = new Headers();

  const namespace = process.env.AUTH_COOKIE_NAMESPACE ? `${process.env.AUTH_COOKIE_NAMESPACE}.` : "";
  const authCookieNames = [
    `${namespace}authjs.session-token`,
    `__Secure-${namespace}authjs.session-token`,
    `${namespace}authjs.callback-url`,
    `__Secure-${namespace}authjs.callback-url`,
    `${namespace}authjs.csrf-token`,
    `__Host-${namespace}authjs.csrf-token`,
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "next-auth.session-token",
  ];

  // Clear cookies for wildcard domain
  for (const name of authCookieNames) {
    if (!name.startsWith("__Host-")) {
      headers.append("Set-Cookie", `${name}=; Path=/; Domain=${baseDomain}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
    }
  }
  
  // Clear local cookies (for localhost / direct domain access)
  for (const name of authCookieNames) {
    headers.append("Set-Cookie", `${name}=; Path=/; Max-Age=0; HttpOnly; ${name.startsWith("__Secure-") || name.startsWith("__Host-") ? "Secure; " : ""}SameSite=Lax`);
  }

  applyCredentialCorsHeaders(headers, origin, "POST, OPTIONS");

  return NextResponse.json({ success: true }, { headers });
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const headers = applyCredentialCorsHeaders(
    new Headers({ "Access-Control-Max-Age": "86400" }),
    origin,
    "POST, OPTIONS",
  );

  return new Response(null, { status: 204, headers });
}
