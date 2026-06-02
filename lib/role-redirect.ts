import { DOMAINS } from "@/lib/domains";

export type AppRole = "ADMIN" | "KINESIOLOGO" | "CLIENTE" | "MARKETING" | null | undefined;

export function getDashboardRouteForRole(role: AppRole): string {
  if (role === "ADMIN") {
    return "/admin";
  }
  if (role === "KINESIOLOGO") {
    return "/kinesio";
  }
  if (role === "MARKETING") {
    return "/marketing-admin";
  }
  return "/cliente";
}

export function getAbsoluteDashboardRouteForRole(role: AppRole, host: string): string {
  const parts = host.split(":");
  const cleanHost = parts[0];
  const port = parts[1] ? `:${parts[1]}` : "";

  let baseDomain = cleanHost;
  let prefix = "";

  // Extract env prefix like 'dev-' or 'dev1-' if present before the subdomain
  const prefixMatch = baseDomain.match(/^([a-zA-Z0-9]+-)/);
  if (prefixMatch) {
    prefix = prefixMatch[1];
    baseDomain = baseDomain.substring(prefix.length);
  }
  
  // Strip subdomains if they are present in the host we logged in from
  if (baseDomain.startsWith("tienda.")) baseDomain = baseDomain.replace(/^tienda\./, "");
  else if (baseDomain.startsWith("kine.")) baseDomain = baseDomain.replace(/^kine\./, "");
  else if (baseDomain.startsWith("dashboard.")) baseDomain = baseDomain.replace(/^dashboard\./, "");
  else if (baseDomain.startsWith("www.")) baseDomain = baseDomain.replace(/^www\./, "");

  const protocol = cleanHost.includes("localhost") || cleanHost.includes("127.0.0.1") ? "http" : "https";

  if (role === "ADMIN") {
    return `${protocol}://${prefix}dashboard.${baseDomain}${port}`;
  }
  if (role === "KINESIOLOGO") {
    return `${protocol}://${prefix}kine.${baseDomain}${port}`;
  }
  if (role === "MARKETING") {
    const envMarketingUrl = process.env.MARKETING_URL || process.env.NEXT_PUBLIC_MARKETING_URL;
    if (envMarketingUrl) {
      return envMarketingUrl;
    }
    // Use the configured marketing URL from env (avoids hardcoded subdomains)
    return DOMAINS.marketing;
  }
  // CLIENTE
  return `${protocol}://${prefix}tienda.${baseDomain}${port}`;
}

