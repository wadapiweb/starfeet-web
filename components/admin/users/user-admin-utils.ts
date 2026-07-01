import { Role } from "@prisma/client";

export const roleOptions: Array<{ value: Role | "all"; label: string }> = [
  { value: "all", label: "Todos los roles" },
  { value: "CLIENTE", label: "Cliente" },
  { value: "KINESIOLOGO", label: "Kinesiólogo" },
  { value: "ADMIN", label: "Admin" },
  { value: "MARKETING", label: "Marketing" },
];

export function roleLabel(role: Role | string) {
  switch (role) {
    case "CLIENTE":
      return "Cliente";
    case "KINESIOLOGO":
      return "Kinesiólogo";
    case "ADMIN":
      return "Admin";
    case "MARKETING":
      return "Marketing";
    default:
      return role;
  }
}

export function statusLabel(status: string) {
  switch (status) {
    case "active":
      return "Activo";
    case "inactive":
      return "Inactivo";
    case "blocked":
      return "Bloqueado";
    default:
      return status;
  }
}

export function statusClassName(status: string) {
  switch (status) {
    case "active":
      return "border-green-200 bg-green-50 text-green-700";
    case "inactive":
      return "border-gray-200 bg-gray-50 text-gray-600";
    case "blocked":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-white text-gray-700";
  }
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatCurrency(value: number, currency: string) {
  return `${currency} ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)}`;
}
