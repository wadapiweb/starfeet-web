import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { readClientIp } from "@/lib/security/rate-limit";
import { consumeCredentialsRateLimit } from "@/lib/security/auth-rate-limit.service";
import { auditAuthEvent } from "@/lib/security/auth-audit.service";
import { isAccountLocked, recordFailedLogin, recordSuccessfulLogin } from "@/lib/security/account-lockout.service";

const CREDENTIALS_ROUTE = "/api/auth/callback/credentials";

type CredentialInput = Partial<Record<"email" | "password", unknown>>;

export async function authorizeCredentials(credentials: CredentialInput | undefined, request?: Request) {
  const rawEmail = credentials?.email;
  const rawPassword = credentials?.password;
  const email = typeof rawEmail === "string" ? rawEmail.toLowerCase().trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  if (!email || !password) return null;

  const ip = request ? readClientIp(request) : "unknown";
  const userAgent = request?.headers.get("user-agent");
  const rateLimit = await consumeCredentialsRateLimit(ip, email);

  if (!rateLimit.allowed) {
    auditAuthEvent({
      action: "AUTH_RATE_LIMIT_BLOCKED",
      outcome: "blocked",
      email,
      ip,
      provider: "credentials",
      route: CREDENTIALS_ROUTE,
      reason: "persistent_rate_limit",
      userAgent,
    });
    return null;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password || !user.isActive) {
    auditAuthEvent({
      action: "AUTH_LOGIN_FAILED",
      outcome: "failed",
      actorUserId: user?.id,
      actorRole: user?.role,
      email,
      ip,
      provider: "credentials",
      route: CREDENTIALS_ROUTE,
      reason: "user_not_found_or_inactive_or_no_password",
      userAgent,
    });
    return null;
  }

  if (isAccountLocked(user)) {
    auditAuthEvent({
      action: "AUTH_LOGIN_FAILED",
      outcome: "blocked",
      actorUserId: user.id,
      actorRole: user.role,
      email,
      ip,
      provider: "credentials",
      route: CREDENTIALS_ROUTE,
      reason: "account_locked",
      userAgent,
    });
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const { nextFailedAttempts, shouldLock } = await recordFailedLogin(user);
    auditAuthEvent({
      action: "AUTH_LOGIN_FAILED",
      outcome: shouldLock ? "blocked" : "failed",
      actorUserId: user.id,
      actorRole: user.role,
      email,
      ip,
      provider: "credentials",
      route: CREDENTIALS_ROUTE,
      reason: shouldLock ? "invalid_password_account_locked" : "invalid_password",
      userAgent,
      metadata: { failedLoginAttempts: nextFailedAttempts },
    });
    return null;
  }

  await recordSuccessfulLogin(user.id);
  auditAuthEvent({
    action: "AUTH_LOGIN_SUCCESS",
    outcome: "success",
    actorUserId: user.id,
    actorRole: user.role,
    email,
    ip,
    provider: "credentials",
    route: CREDENTIALS_ROUTE,
    userAgent,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    sessionVersion: user.sessionVersion,
  };
}
