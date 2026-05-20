import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  const origin = request.headers.get("origin");

  // We fetch the base domain dynamically or list the trusted origins
  const allowedOrigins = [
    "https://starfeet.ar",
    "https://dev.starfeet.ar",
    "https://dev1.starfeet.ar",
    "http://localhost:3000",
    "http://localhost:3001"
  ];

  const headers: Record<string, string> = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };

  if (origin && allowedOrigins.some(o => origin.startsWith(o) || o.startsWith(origin))) {
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
