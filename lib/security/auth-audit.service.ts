import { Role } from "@prisma/client";
import { auditSecurityEvent } from "@/lib/security/audit";
import { persistSecurityEvent } from "@/lib/security/persistent-audit";

type AuthAuditAction =
  | "AUTH_RATE_LIMIT_BLOCKED"
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILED"
  | "PASSWORD_RESET_CODE_REQUESTED"
  | "PASSWORD_RESET_CODE_REJECTED"
  | "PASSWORD_RESET_SUCCEEDED"
  | "GUEST_ACCESS_CODE_REQUESTED"
  | "GUEST_ACCESS_CODE_REJECTED"
  | "GUEST_ACCESS_GRANTED"
  | "REGISTER_SUCCEEDED"
  | "REGISTER_LINKED_GOOGLE"
  | "REGISTER_REJECTED";

type AuthAuditInput = {
  action: AuthAuditAction;
  outcome?: "success" | "failed" | "blocked";
  actorUserId?: string | null;
  actorRole?: Role | null;
  email?: string | null;
  ip?: string;
  route?: string;
  reason?: string;
  provider?: string;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export function auditAuthEvent(input: AuthAuditInput) {
  auditSecurityEvent({
    action: input.action,
    email: input.email,
    ip: input.ip,
    route: input.route,
    reason: input.reason,
    provider: input.provider,
  });

  persistSecurityEvent({
    action: input.action,
    outcome: input.outcome,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    email: input.email,
    ip: input.ip,
    route: input.route,
    reason: input.reason,
    provider: input.provider,
    userAgent: input.userAgent,
    metadata: input.metadata,
  });
}
