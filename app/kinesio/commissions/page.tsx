import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function KinesioCommissionsPage() {
  return (
    <ModulePlaceholder
      moduleName="Comisiones"
      summary="Detalle de comisiones devengadas, estado y exportación."
      backlog={[
        "Filtro por estado y período",
        "Detalle de orden relacionada",
        "Exportación CSV con trazabilidad",
      ]}
    />
  );
}
