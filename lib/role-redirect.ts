export type AppRole = "ADMIN" | "KINESIOLOGO" | "CLIENTE" | null | undefined;

export function getDashboardRouteForRole(role: AppRole): string {
  if (role === "ADMIN") {
    return "/admin";
  }
  if (role === "KINESIOLOGO") {
    return "/kinesio";
  }
  return "/cliente";
}

export function getAbsoluteDashboardRouteForRole(role: AppRole, host: string): string {
  const parts = host.split(":");
  const cleanHost = parts[0];
  const port = parts[1] ? `:${parts[1]}` : "";

  let baseDomain = cleanHost;
  
  // Strip subdomains if they are present in the host we logged in from
  if (baseDomain.startsWith("tienda.")) baseDomain = baseDomain.replace(/^tienda\./, "");
  else if (baseDomain.startsWith("kine.")) baseDomain = baseDomain.replace(/^kine\./, "");
  else if (baseDomain.startsWith("dashboard.")) baseDomain = baseDomain.replace(/^dashboard\./, "");
  else if (baseDomain.startsWith("www.")) baseDomain = baseDomain.replace(/^www\./, "");

  const protocol = cleanHost.includes("localhost") || cleanHost.includes("127.0.0.1") ? "http" : "https";

  if (role === "ADMIN") {
    return `${protocol}://dashboard.${baseDomain}${port}`;
  }
  if (role === "KINESIOLOGO") {
    return `${protocol}://kine.${baseDomain}${port}`;
  }
  // CLIENTE
  return `${protocol}://tienda.${baseDomain}${port}`;
}

