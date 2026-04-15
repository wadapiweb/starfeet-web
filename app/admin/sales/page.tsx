import { ModulePlaceholder } from "@/components/backoffice/ModulePlaceholder";

export default function AdminSalesPage() {
  return (
    <ModulePlaceholder
      moduleName="Ventas"
      summary="Módulo para órdenes, pagos, estados logísticos y analítica comercial."
      backlog={[
        "Listado de órdenes con filtros avanzados",
        "Timeline de estados de pago/envío",
        "Acciones masivas y exportables",
      ]}
    />
  );
}
