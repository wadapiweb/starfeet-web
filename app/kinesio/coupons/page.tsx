import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function KinesioCouponsPage() {
  return (
    <ModulePlaceholder
      moduleName="Mis Cupones"
      summary="Visibilidad de cupones asignados, uso y vigencia operacional."
      backlog={[
        "Tabla de cupones con progreso de uso",
        "Indicador de caducidad próxima",
        "Detalle de redenciones por paciente",
      ]}
    />
  );
}
