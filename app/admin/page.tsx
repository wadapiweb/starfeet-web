import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function AdminPage() {
  return (
    <ModulePlaceholder
      moduleName="Resumen"
      summary="Tablero ejecutivo con estado general de operación y prioridades del día."
      backlog={[
        "KPIs de ventas y conversión en tiempo real",
        "Alertas de cupones por vencer y alto uso",
        "Salud de pagos, envíos y entregas",
      ]}
    />
  );
}
