import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getDashboardRouteForRole } from "@/lib/role-redirect";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(getDashboardRouteForRole(session.user.role));
  }

  return (
    <AuthShell
      title="Ingresar"
      subtitle="Accede con email y contraseña o con Google."
    >
      <LoginForm />
    </AuthShell>
  );
}
