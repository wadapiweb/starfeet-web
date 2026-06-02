import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || ".starfeet.ar";
  const cleanBase = baseDomain.startsWith(".") ? baseDomain.slice(1) : baseDomain;

  const origin = request.headers.get("origin");
  const isAllowed = origin && (
    origin.endsWith(cleanBase) ||
    origin === "http://localhost:3000" ||
    origin === "http://localhost:3001" ||
    origin.startsWith("http://localhost:")
  );

  const headers = new Headers();
  
  // Clear cookies for wildcard domain
  headers.append("Set-Cookie", `authjs.session-token=; Path=/; Domain=${baseDomain}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  headers.append("Set-Cookie", `__Secure-authjs.session-token=; Path=/; Domain=${baseDomain}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  headers.append("Set-Cookie", `next-auth.session-token=; Path=/; Domain=${baseDomain}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  
  // Clear local cookies (for localhost / direct domain access)
  headers.append("Set-Cookie", "authjs.session-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
  headers.append("Set-Cookie", "__Secure-authjs.session-token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
  headers.append("Set-Cookie", "next-auth.session-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");

  if (origin && isAllowed) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }

  return NextResponse.json({ success: true }, { headers });
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const headers = new Headers({
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  });
  
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  
  return new Response(null, { status: 204, headers });
}
