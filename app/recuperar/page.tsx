import { AuthShell } from "@/components/auth/AuthShell";
import { RecoveryForm } from "@/components/auth/RecoveryForm";

export default function RecoveryPage() {
  return (
    <AuthShell
      title="Recuperar Acceso"
      subtitle="Te enviamos un código temporal para restablecer tu contraseña."
    >
      <RecoveryForm />
    </AuthShell>
  );
}
