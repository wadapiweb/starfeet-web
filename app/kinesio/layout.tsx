import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BackofficeShell } from "@/components/backoffice/BackofficeShell";
import { kinesioNavItems } from "@/lib/backoffice-navigation";
import { getAbsoluteDashboardRouteForRole } from "@/lib/role-redirect";
import { headers } from "next/headers";
import { DOMAINS } from "@/lib/domains";

export default async function KinesioLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.isActive || session.user.sessionRevoked) {
    redirect("/login");
  }
  if (session.user.role !== "KINESIOLOGO") {
    const headersList = await headers();
    const host = headersList.get("host") || DOMAINS.root;
    redirect(getAbsoluteDashboardRouteForRole(session.user.role, host));
  }

  return (
    <BackofficeShell
      area="KINESIO"
      title="Portal Kinesio"
      subtitle="Workspace mobile-first para cupones, pacientes y liquidaciones."
      navItems={kinesioNavItems}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </BackofficeShell>
  );
}
