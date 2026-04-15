import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function KinesioProfilePage() {
  return (
    <ModulePlaceholder
      moduleName="Perfil"
      summary="Datos profesionales del kinesiólogo y seguridad de su cuenta."
      backlog={[
        "Datos de contacto y matrícula",
        "Cambio de contraseña y sesiones activas",
        "Preferencias de notificación",
      ]}
    />
  );
}
