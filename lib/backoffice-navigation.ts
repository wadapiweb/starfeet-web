export type BackofficeNavItem = {
  href: string;
  label: string;
  description: string;
  matchPrefix?: string;
};

export const adminNavItems: BackofficeNavItem[] = [
  {
    href: "/admin",
    label: "Resumen",
    description: "KPIs y estado general",
  },
  {
    href: "/admin/coupons",
    label: "Cupones",
    description: "Creación, filtros y asignaciones",
    matchPrefix: "/admin/coupons",
  },
  {
    href: "/admin/professionals",
    label: "Profesionales",
    description: "Alta y gestión de profesionales",
    matchPrefix: "/admin/professionals",
  },
  {
    href: "/admin/sales",
    label: "Ventas",
    description: "Órdenes, pagos y envíos",
    matchPrefix: "/admin/sales",
  },
  {
    href: "/admin/crm",
    label: "CRM",
    description: "Leads, campañas y seguimiento",
    matchPrefix: "/admin/crm",
  },
  {
    href: "/admin/finance",
    label: "Finanzas",
    description: "Comisiones y liquidaciones",
    matchPrefix: "/admin/finance",
  },
];

export const kinesioNavItems: BackofficeNavItem[] = [
  {
    href: "/kinesio",
    label: "Dashboard",
    description: "Métricas y actividad reciente",
  },
  {
    href: "/kinesio/coupons",
    label: "Mis cupones",
    description: "Asignados, uso y vigencia",
    matchPrefix: "/kinesio/coupons",
  },
  {
    href: "/kinesio/patients",
    label: "Pacientes",
    description: "Seguimiento por fecha y detalle",
    matchPrefix: "/kinesio/patients",
  },
  {
    href: "/kinesio/commissions",
    label: "Comisiones",
    description: "Devengado, estados y exportable",
    matchPrefix: "/kinesio/commissions",
  },
  {
    href: "/kinesio/payouts",
    label: "Liquidaciones",
    description: "Cierres por período",
    matchPrefix: "/kinesio/payouts",
  },
];
