import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crear Cuenta"
      subtitle="Regístrate con email o integra tu cuenta Google existente."
    >
      <RegisterForm />
    </AuthShell>
  );
}
