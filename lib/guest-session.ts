import crypto from "crypto";

type GuestPayload = {
  email: string;
  exp: number;
};

const COOKIE_NAME = "guest_access_session";

function b64(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function unb64(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(data: string) {
  const secret = process.env.AUTH_SECRET || "dev-secret";
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function createGuestToken(email: string, maxAgeSeconds = 60 * 60) {
  const payload: GuestPayload = {
    email: email.toLowerCase().trim(),
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encoded = b64(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyGuestToken(token: string | undefined | null) {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  if (sign(encoded) !== signature) return null;

  const payload = JSON.parse(unb64(encoded)) as GuestPayload;
  if (!payload.email || !payload.exp) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export const guestSessionCookieName = COOKIE_NAME;
