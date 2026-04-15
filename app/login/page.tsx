import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="Ingresar"
      subtitle="Accede con email y contraseña o con Google."
    >
      <LoginForm />
    </AuthShell>
  );
}
