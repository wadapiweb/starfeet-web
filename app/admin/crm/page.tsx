import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function AdminCrmPage() {
  return (
    <ModulePlaceholder
      moduleName="CRM"
      summary="Pipeline de leads, campañas y automatizaciones comerciales."
      backlog={[
        "Kanban de etapas de lead",
        "Automatización de carrito abandonado",
        "Segmentación por comportamiento de compra",
      ]}
    />
  );
}
