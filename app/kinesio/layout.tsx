import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BackofficeShell } from "@/components/backoffice/BackofficeShell";
import { kinesioNavItems } from "@/lib/backoffice-navigation";

export default async function KinesioLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "KINESIOLOGO") {
    redirect("/");
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
