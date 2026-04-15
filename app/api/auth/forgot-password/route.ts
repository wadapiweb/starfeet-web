import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { generateCode, getAccessCodeExpiry, hashAccessCode } from "@/lib/access-codes";
import { sendMail } from "@/lib/mailer";

type Body = { email: string };

export async function POST(request: Request) {
  try {
    const { email } = await parseJson<Body>(request);
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail) {
      throw new ApiError(400, "Email inválido");
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.isActive) {
      return NextResponse.json({ ok: true });
    }

    const code = generateCode();
    const codeHash = hashAccessCode(normalizedEmail, code, "PASSWORD_RESET");
    const expiresAt = getAccessCodeExpiry();

    await prisma.accessCode.create({
      data: {
        email: normalizedEmail,
        userId: user.id,
        type: "PASSWORD_RESET",
        codeHash,
        expiresAt,
      },
    });

    const sent = await sendMail({
      to: normalizedEmail,
      subject: "Recuperación de contraseña - Starfeet",
      html: `<p>Tu código de recuperación es <strong>${code}</strong>.</p><p>Expira en 15 minutos.</p>`,
    });

    return NextResponse.json({
      ok: true,
      ...(sent.sent
        ? {}
        : process.env.NODE_ENV !== "production"
          ? { devCode: code }
          : {}),
    });
  } catch (error) {
    return jsonError(error);
  }
}
