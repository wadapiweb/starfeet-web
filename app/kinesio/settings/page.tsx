import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function KinesioSettingsPage() {
  return (
    <ModulePlaceholder
      moduleName="Configuración"
      summary="Ajustes del entorno de trabajo del kinesiólogo."
      backlog={[
        "Preferencias de visualización mobile-first",
        "Filtros por período para métricas",
        "Formato de exportación de liquidaciones",
      ]}
    />
  );
}
