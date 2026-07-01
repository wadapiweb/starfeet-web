import { Account, User } from "next-auth";
import prisma from "@/lib/prisma";
import { ensureUserSlug } from "@/lib/slug";
import { auditAuthEvent } from "@/lib/security/auth-audit.service";
import { recordSuccessfulLogin } from "@/lib/security/account-lockout.service";

const OAUTH_ROUTE = "/api/auth/callback";

export async function authorizeOAuthSignIn(user: User, account: Account | null) {
  if (!user?.email) return false;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email.toLowerCase() },
    select: { id: true, isActive: true, name: true, slug: true, role: true },
  });

  if (!dbUser) {
    auditAuthEvent({
      action: "AUTH_LOGIN_SUCCESS",
      outcome: "success",
      email: user.email,
      provider: account?.provider,
      route: OAUTH_ROUTE,
      reason: "new_user_allowed",
    });
    return true;
  }

  if (!dbUser.isActive) {
    auditAuthEvent({
      action: "AUTH_LOGIN_FAILED",
      outcome: "failed",
      actorUserId: dbUser.id,
      actorRole: dbUser.role,
      email: user.email,
      provider: account?.provider,
      route: OAUTH_ROUTE,
      reason: "inactive_user",
    });
    return false;
  }

  if (!dbUser.slug) {
    await ensureUserSlug(dbUser.id, dbUser.name ?? user.name, user.email);
  }

  await recordSuccessfulLogin(dbUser.id);
  auditAuthEvent({
    action: "AUTH_LOGIN_SUCCESS",
    outcome: "success",
    actorUserId: dbUser.id,
    actorRole: dbUser.role,
    email: user.email,
    provider: account?.provider,
    route: OAUTH_ROUTE,
  });

  return true;
}
