import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    "https://starfeet.ar",
    "https://dev.starfeet.ar",
    "https://dev1.starfeet.ar",
    "http://localhost:3000",
    "http://localhost:3001"
  ];

  const headers = new Headers();
  
  // Clear cookies for wildcard domain .starfeet.ar
  headers.append("Set-Cookie", "authjs.session-token=; Path=/; Domain=.starfeet.ar; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
  headers.append("Set-Cookie", "__Secure-authjs.session-token=; Path=/; Domain=.starfeet.ar; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
  headers.append("Set-Cookie", "next-auth.session-token=; Path=/; Domain=.starfeet.ar; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
  
  // Clear local cookies (for localhost / direct domain access)
  headers.append("Set-Cookie", "authjs.session-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
  headers.append("Set-Cookie", "__Secure-authjs.session-token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
  headers.append("Set-Cookie", "next-auth.session-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");

  if (origin && allowedOrigins.some(o => origin.startsWith(o) || o.startsWith(origin))) {
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
