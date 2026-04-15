import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function AdminProfilePage() {
  return (
    <ModulePlaceholder
      moduleName="Perfil"
      summary="Gestión del perfil del administrador, seguridad y datos de cuenta."
      backlog={[
        "Datos personales y cambio de contraseña",
        "Preferencias de idioma y moneda",
        "Auditoría de accesos recientes",
      ]}
    />
  );
}
