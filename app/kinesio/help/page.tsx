import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function KinesioHelpPage() {
  return (
    <ModulePlaceholder
      moduleName="Ayuda"
      summary="Soporte para uso de cupones, pacientes y comisiones."
      backlog={[
        "Tutorial de lectura de métricas",
        "Consultas sobre estado de comisiones",
        "FAQ de cupón asignado y uso",
      ]}
    />
  );
}
