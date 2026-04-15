import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function AdminFinancePage() {
  return (
    <ModulePlaceholder
      moduleName="Finanzas"
      summary="Consolidado de comisiones, liquidaciones y flujo de caja operativo."
      backlog={[
        "Cierre y pago por período de kinesiólogos",
        "Conciliación de pagos por proveedor",
        "Reporte ARS/USD con trazabilidad",
      ]}
    />
  );
}
