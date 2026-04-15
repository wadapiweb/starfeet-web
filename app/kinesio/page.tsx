import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { KinesioDashboard } from "@/components/kinesio/KinesioDashboard";
import { BackofficeShell } from "@/components/backoffice/BackofficeShell";
import { kinesioNavItems } from "@/lib/backoffice-navigation";

export default async function KinesioPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }
  if (session.user.role !== "KINESIOLOGO") {
    redirect("/");
  }

  return (
    <BackofficeShell
      area="KINESIO"
      title="Portal Kinesio"
      subtitle="Vista mobile-first para seguimiento de cupones, pacientes relacionados y ganancias."
      navItems={kinesioNavItems}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <KinesioDashboard />
    </BackofficeShell>
  );
}
