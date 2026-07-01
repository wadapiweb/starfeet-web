import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getAbsoluteDashboardRouteForRole } from "@/lib/role-redirect";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DOMAINS } from "@/lib/domains";
import { Suspense } from "react";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.isActive && !session.user.sessionRevoked) {
    const headersList = await headers();
    const host = headersList.get("host") || DOMAINS.root;
    redirect(getAbsoluteDashboardRouteForRole(session.user.role, host));
  }


  return (
    <AuthShell
      title="Ingresar"
      subtitle="Accede con email y contraseña o con Google."
    >
      <Suspense fallback={<div className="text-sm text-gray-500">Cargando formulario...</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
