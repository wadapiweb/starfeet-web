import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { applyCredentialCorsHeaders } from "@/lib/security/origin";

export async function GET(request: Request) {
  const session = await auth();
  const origin = request.headers.get("origin");
  const headers = applyCredentialCorsHeaders(
    new Headers({ "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" }),
    origin,
    "GET, OPTIONS",
  );

  return NextResponse.json(session || { user: null }, { headers });
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const headers = applyCredentialCorsHeaders(
    new Headers({ "Access-Control-Max-Age": "86400" }),
    origin,
    "GET, OPTIONS",
  );

  return new Response(null, { status: 204, headers });
}
