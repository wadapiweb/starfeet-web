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
