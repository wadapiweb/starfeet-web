import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BackofficeShell } from "@/components/backoffice/BackofficeShell";
import { adminNavItems } from "@/lib/backoffice-navigation";
import { getAdminSettingsSnapshot } from "@/lib/admin-settings.server";
import { getAbsoluteDashboardRouteForRole } from "@/lib/role-redirect";
import { headers } from "next/headers";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    const headersList = await headers();
    const host = headersList.get("host") || "starfeet.ar";
    redirect(getAbsoluteDashboardRouteForRole(session.user.role, host));
  }
  const settings = await getAdminSettingsSnapshot().catch(() => null);
  const themeMode = settings?.appearance?.themeMode === "dark" ? "dark" : "light";

  return (
    <BackofficeShell
      area="ADMIN"
      title="Panel Admin"
      subtitle="Gestión operativa integral para e-commerce, CRM y finanzas."
      navItems={adminNavItems}
      userName={session.user.name}
      userEmail={session.user.email}
      themeMode={themeMode}
    >
      {children}
    </BackofficeShell>
  );
}
