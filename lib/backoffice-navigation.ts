export type BackofficeNavItem = {
  href: string;
  label: string;
  description: string;
};

export const adminNavItems: BackofficeNavItem[] = [
  {
    href: "/admin",
    label: "Resumen",
    description: "KPIs y estado general",
  },
  {
    href: "/admin?tab=coupons",
    label: "Cupones",
    description: "Creación, filtros y asignaciones",
  },
  {
    href: "/admin?tab=sales",
    label: "Ventas",
    description: "Órdenes, pagos y envíos",
  },
  {
    href: "/admin?tab=crm",
    label: "CRM",
    description: "Leads, campañas y seguimiento",
  },
  {
    href: "/admin?tab=finance",
    label: "Finanzas",
    description: "Comisiones y liquidaciones",
  },
];

export const kinesioNavItems: BackofficeNavItem[] = [
  {
    href: "/kinesio",
    label: "Dashboard",
    description: "Métricas y actividad reciente",
  },
  {
    href: "/kinesio?tab=coupons",
    label: "Mis cupones",
    description: "Asignados, uso y vigencia",
  },
  {
    href: "/kinesio?tab=patients",
    label: "Pacientes",
    description: "Seguimiento por fecha y detalle",
  },
  {
    href: "/kinesio?tab=commissions",
    label: "Comisiones",
    description: "Devengado, estados y exportable",
  },
  {
    href: "/kinesio?tab=payouts",
    label: "Liquidaciones",
    description: "Cierres por período",
  },
];
