import { AuthShell } from "@/components/auth/AuthShell";
import { GuestAccessForm } from "@/components/auth/GuestAccessForm";

export default function GuestPage() {
  return (
    <AuthShell
      title="Acceso Invitado"
      subtitle="Consulta compras hechas sin cuenta usando solo el email de compra."
    >
      <GuestAccessForm />
    </AuthShell>
  );
}
