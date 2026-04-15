type SecurityEventAction =
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

type SecurityEventInput = {
  action: SecurityEventAction;
  email?: string | null;
  ip?: string;
  route?: string;
  reason?: string;
  provider?: string;
};

function maskEmail(email: string) {
  const [localPart = "", domain = ""] = email.toLowerCase().trim().split("@");
  if (!localPart || !domain) return "invalid-email";

  const safeLocal =
    localPart.length <= 2 ? `${localPart[0] ?? "*"}*` : `${localPart.slice(0, 2)}***`;

  return `${safeLocal}@${domain}`;
}

export function auditSecurityEvent(input: SecurityEventInput) {
  const payload = {
    at: new Date().toISOString(),
    channel: "security.auth",
    action: input.action,
    email: input.email ? maskEmail(input.email) : undefined,
    ip: input.ip,
    route: input.route,
    reason: input.reason,
    provider: input.provider,
  };

  console.info(JSON.stringify(payload));
}
