export function currencyLabel(value: number | string, currency: "ARS" | "USD" = "ARS") {
  const amount = Number(value);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function compactNumber(value: number | string) {
  const amount = Number(value);
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "N/A";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateOnly(value: string | Date | null | undefined) {
  if (!value) return "N/A";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(date);
}

export function commissionStatusLabel(status: "PENDING" | "VALIDATED" | "PAID" | "REJECTED") {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "VALIDATED":
      return "Validada";
    case "PAID":
      return "Pagada";
    case "REJECTED":
      return "Rechazada";
  }
}

export function orderStatusLabel(status: string) {
  switch (status) {
    case "INITIATED":
      return "Iniciada";
    case "PENDING_PAYMENT":
      return "Pendiente de pago";
    case "PAID":
      return "Pagada";
    case "SHIPPED":
      return "Enviada";
    case "DELIVERED":
      return "Entregada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
  }
}

export function densityClasses(density: "comfortable" | "compact") {
  return density === "compact" ? "gap-2 p-3" : "gap-3 p-4";
}

export function progressPercent(current: number, max: number) {
  if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / max) * 100)));
}
