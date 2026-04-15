import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BackofficeShell } from "@/components/backoffice/BackofficeShell";
import { adminNavItems } from "@/lib/backoffice-navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <BackofficeShell
      area="ADMIN"
      title="Panel Admin"
      subtitle="Gestión operativa integral para e-commerce, CRM y finanzas."
      navItems={adminNavItems}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </BackofficeShell>
  );
}
