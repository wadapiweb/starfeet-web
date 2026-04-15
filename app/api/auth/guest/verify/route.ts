import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { hashAccessCode } from "@/lib/access-codes";
import { createGuestToken, guestSessionCookieName } from "@/lib/guest-session";

type Body = {
  email: string;
  code: string;
};

export async function POST(request: Request) {
  try {
    const body = await parseJson<Body>(request);
    const email = body.email?.toLowerCase().trim();
    const code = body.code?.trim();

    if (!email || !code) {
      throw new ApiError(400, "Datos inválidos");
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

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
