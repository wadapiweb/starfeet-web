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

  if (cleanHost.includes("localhost") || cleanHost.includes("127.0.0.1")) {
    const protocol = "http";
    if (role === "ADMIN") {
      return `${protocol}://dashboard.localhost${port}`;
    }
    if (role === "KINESIOLOGO") {
      return `${protocol}://kine.localhost${port}`;
    }
    if (role === "MARKETING") {
      return DOMAINS.marketing;
    }
    return `${protocol}://localhost${port}`;
  }

  if (role === "ADMIN") {
    return DOMAINS.dashboard;
  }
  if (role === "KINESIOLOGO") {
    return DOMAINS.kine;
  }
  if (role === "MARKETING") {
    return DOMAINS.marketing;
  }
  // CLIENTE
  return DOMAINS.landing;
}

