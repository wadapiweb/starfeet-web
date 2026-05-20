import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getDashboardRouteForRole } from "@/lib/role-redirect";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";

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
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <LoginForm />
      </NextIntlClientProvider>
    </AuthShell>
  );
}
