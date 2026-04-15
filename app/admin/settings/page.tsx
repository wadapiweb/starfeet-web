import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function AdminSettingsPage() {
  return (
    <ModulePlaceholder
      moduleName="Configuración"
      summary="Parámetros globales de la operación, integraciones y reglas de negocio."
      backlog={[
        "Parámetros de cupones y vigencia",
        "Métodos de pago y políticas de envío",
        "Plantillas de email y automatizaciones",
      ]}
    />
  );
}
