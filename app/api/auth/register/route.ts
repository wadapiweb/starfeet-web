import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { consumeRateLimit, readClientIp } from "@/lib/security/rate-limit";
import { auditSecurityEvent } from "@/lib/security/audit";
import { generateUniqueUserSlug } from "@/lib/slug";
import { getAdminSecuritySettings } from "@/lib/admin-settings.server";

type Body = {
  email: string;
  password: string;
  name?: string;
};

export async function POST(request: Request) {
  try {
    const ip = readClientIp(request);
    const rateLimit = consumeRateLimit(`auth:register:${ip}`, { windowMs: 15 * 60 * 1000, max: 12 });
    if (!rateLimit.allowed) {
      auditSecurityEvent({
        action: "AUTH_RATE_LIMIT_BLOCKED",
        ip,
        route: "/api/auth/register",
        reason: "too_many_register_attempts",
      });
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta nuevamente más tarde." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = await parseJson<Body>(request);
    const email = body.email?.toLowerCase().trim();
    const password = body.password?.trim();
    const name = body.name?.trim() || null;
    const securitySettings = await getAdminSecuritySettings();

    if (!email || !password || password.length < securitySettings.minPasswordLength) {
      auditSecurityEvent({
        action: "REGISTER_REJECTED",
        email,
        ip,
        route: "/api/auth/register",
        reason: "invalid_payload",
      });
      throw new ApiError(
        400,
        `Datos inválidos. La contraseña debe tener al menos ${securitySettings.minPasswordLength} caracteres.`,
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (!existing) {
      const slug = await generateUniqueUserSlug(name, email);
      const user = await prisma.user.create({
        data: {
          slug,
          email,
          password: hashed,
          name,
          role: "CLIENTE",
          isActive: true,
        },
      });
      auditSecurityEvent({
        action: "REGISTER_SUCCEEDED",
        email,
        ip,
        route: "/api/auth/register",
      });
      return NextResponse.json({ userId: user.id }, { status: 201 });
    }

    if (!existing.isActive) {
      auditSecurityEvent({
        action: "REGISTER_REJECTED",
        email,
        ip,
        route: "/api/auth/register",
        reason: "inactive_user",
      });
      throw new ApiError(403, "Usuario inactivo");
    }

    if (existing.password) {
      auditSecurityEvent({
        action: "REGISTER_REJECTED",
        email,
        ip,
        route: "/api/auth/register",
        reason: "email_already_registered",
      });
      throw new ApiError(409, "Ese email ya tiene una cuenta con contraseña.");
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hashed,
        ...(name ? { name } : {}),
      },
    });

    if (!existing.slug) {
      const slug = await generateUniqueUserSlug(name ?? existing.name, email, existing.id);
      await prisma.user.update({
        where: { id: existing.id },
        data: { slug },
      });
    }

    auditSecurityEvent({
      action: "REGISTER_LINKED_GOOGLE",
      email,
      ip,
      route: "/api/auth/register",
    });

    return NextResponse.json({ userId: user.id, linkedGoogleAccount: true });
  } catch (error) {
    return jsonError(error);
  }
}
