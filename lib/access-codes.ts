import crypto from "crypto";

const ACCESS_CODE_TTL_MINUTES = 15;

export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getAccessCodeExpiry() {
  return new Date(Date.now() + ACCESS_CODE_TTL_MINUTES * 60 * 1000);
}

export function hashAccessCode(email: string, code: string, type: string) {
  const secret = process.env.AUTH_SECRET || "dev-secret";
  return crypto
    .createHash("sha256")
    .update(`${email.toLowerCase().trim()}|${code}|${type}|${secret}`)
    .digest("hex");
}
