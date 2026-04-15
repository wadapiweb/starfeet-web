import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function KinesioPatientsPage() {
  return (
    <ModulePlaceholder
      moduleName="Pacientes"
      summary="Seguimiento clínico-comercial de pacientes vinculados por cupón."
      backlog={[
        "Búsqueda por email, nombre y rango de fecha",
        "Historial de órdenes por paciente",
        "Vista de evolución y recurrencia",
      ]}
    />
  );
}
