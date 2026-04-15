import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function KinesioPayoutsPage() {
  return (
    <ModulePlaceholder
      moduleName="Liquidaciones"
      summary="Cierres por período y pagos realizados al profesional."
      backlog={[
        "Resumen por período con totales",
        "Detalle de líneas incluidas",
        "Estado de pago y fecha de acreditación",
      ]}
    />
  );
}
