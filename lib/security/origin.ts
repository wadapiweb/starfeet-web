import { DOMAINS } from "@/lib/domains";

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function getCleanBaseDomain() {
  return DOMAINS.base.startsWith(".") ? DOMAINS.base.slice(1) : DOMAINS.base;
}

export function isAllowedEcosystemHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  const cleanBase = getCleanBaseDomain().toLowerCase();

  if (LOCALHOST_HOSTS.has(normalized)) return true;
  return normalized === cleanBase || normalized.endsWith(`.${cleanBase}`);
}

export function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;

  try {
    const parsed = new URL(origin);
    const isLocalhost = LOCALHOST_HOSTS.has(parsed.hostname);
    if (!isLocalhost && parsed.protocol !== "https:") return false;
    return isAllowedEcosystemHostname(parsed.hostname);
  } catch {
    return false;
  }
}

export function applyCredentialCorsHeaders(headers: Headers, origin: string | null, methods: string) {
  if (!isAllowedOrigin(origin)) return headers;

  headers.set("Access-Control-Allow-Origin", origin as string);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", methods);
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Vary", "Origin");
  return headers;
}

export function getSafeRedirectUrl(input: string | undefined | null, fallback: string) {
  if (!input) return fallback;

  try {
    if (input.startsWith("/")) return input;

    const parsed = new URL(input);
    if (!isAllowedEcosystemHostname(parsed.hostname)) return fallback;
    if (!LOCALHOST_HOSTS.has(parsed.hostname) && parsed.protocol !== "https:") return fallback;
    return parsed.toString();
  } catch {
    return fallback;
  }
}
