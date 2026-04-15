import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminCouponsManager } from "@/components/admin/AdminCouponsManager";
import { BackofficeShell } from "@/components/backoffice/BackofficeShell";
import { adminNavItems } from "@/lib/backoffice-navigation";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <BackofficeShell
      area="ADMIN"
      title="Panel Admin"
      subtitle="Acceso central a ventas, cupones, envíos, leads, campañas y finanzas."
      navItems={adminNavItems}
      userName={session.user.name}
      userEmail={session.user.email}
    >
        <AdminCouponsManager />
    </BackofficeShell>
  );
}
