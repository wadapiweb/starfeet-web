import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  console.log("=== PUBLIC SESSION ENDPOINT ===");
  console.log("Cookies received:", cookieHeader);

  const session = await auth();
  console.log("Session resolved:", session);

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || ".starfeet.ar";
  const cleanBase = baseDomain.startsWith(".") ? baseDomain.slice(1) : baseDomain;

  const origin = request.headers.get("origin");
  const isAllowed = origin && (
    origin.endsWith(cleanBase) ||
    origin === "http://localhost:3000" ||
    origin === "http://localhost:3001" ||
    origin.startsWith("http://localhost:")
  );

  const headers: Record<string, string> = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };

  if (origin && isAllowed) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
  }

  return NextResponse.json(session || { user: null }, { headers });
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  
  return new Response(null, { status: 204, headers });
}
