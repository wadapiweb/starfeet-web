import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function AdminHelpPage() {
  return (
    <ModulePlaceholder
      moduleName="Ayuda"
      summary="Centro de soporte operativo para el equipo de administración."
      backlog={[
        "Guías rápidas por módulo",
        "Canal de soporte y tiempos de respuesta",
        "FAQ de operaciones críticas",
      ]}
    />
  );
}
