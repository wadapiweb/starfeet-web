import crypto from "crypto";
import { Prisma, Role } from "@prisma/client";
import prisma from "@/lib/prisma";

type PersistentSecurityEventInput = {
  action: string;
  outcome?: string;
  actorUserId?: string | null;
  actorRole?: Role | null;
  email?: string | null;
  ip?: string;
  route?: string;
  reason?: string;
  provider?: string;
  resourceType?: string;
  resourceId?: string;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

function hashEmail(email: string) {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

export function persistSecurityEvent(input: PersistentSecurityEventInput) {
  void prisma.securityAuditEvent
    .create({
      data: {
        action: input.action,
        outcome: input.outcome,
        actorUserId: input.actorUserId || null,
        actorRole: input.actorRole || null,
        emailHash: input.email ? hashEmail(input.email) : null,
        ip: input.ip,
        route: input.route,
        reason: input.reason,
        provider: input.provider,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        userAgent: input.userAgent || undefined,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    })
    .catch((error) => {
      console.error("security_audit_persist_failed", error);
    });
}
