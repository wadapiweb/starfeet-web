import { createDefaultProductSizingMatrix } from "@/lib/product-sizing";

export const ADMIN_SETTING_CATEGORIES = [
  "general",
  "appearance",
  "commerce",
  "sizing",
  "payments",
  "notifications",
  "security",
] as const;

export type AdminSettingCategory = (typeof ADMIN_SETTING_CATEGORIES)[number];

export type AdminSettingKind = "text" | "email" | "number" | "boolean" | "select" | "textarea";

export type AdminSettingValue = string | number | boolean;

export type AdminSettingDefinition = {
  category: AdminSettingCategory;
  key: string;
  label: string;
  description: string;
  kind: AdminSettingKind;
  defaultValue: AdminSettingValue;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
};

export const ADMIN_SETTING_DEFINITIONS: AdminSettingDefinition[] = [
  {
    category: "general",
    key: "brandName",
    label: "Nombre de marca",
    description: "Nombre visible en la plataforma, correos y documentos internos.",
    kind: "text",
    defaultValue: "Starfeet",
  },
  {
    category: "general",
    key: "companyLegalName",
    label: "Razón social",
    description: "Nombre legal para referencias internas y futuras integraciones fiscales.",
    kind: "text",
    defaultValue: "Starfeet",
  },
  {
    category: "general",
    key: "supportEmail",
    label: "Email de soporte",
    description: "Contacto visible para usuarios, clientes y profesionales.",
    kind: "email",
    defaultValue: "soporte@starfeet.ar",
  },
  {
    category: "general",
    key: "supportWhatsapp",
    label: "WhatsApp de soporte",
    description: "Número de atención operativa para consultas rápidas.",
    kind: "text",
    defaultValue: "+54 9 11 5555-0000",
  },
  {
    category: "general",
    key: "timezone",
    label: "Zona horaria",
    description: "Zona horaria usada por fechas, cortes y liquidaciones.",
    kind: "select",
    defaultValue: "America/Argentina/Buenos_Aires",
    options: [
      { label: "Buenos Aires", value: "America/Argentina/Buenos_Aires" },
      { label: "UTC", value: "UTC" },
    ],
  },
  {
    category: "appearance",
    key: "themeMode",
    label: "Tema del backoffice",
    description: "Define si el panel administrativo se ve en modo claro u oscuro.",
    kind: "select",
    defaultValue: "light",
    options: [
      { label: "Claro", value: "light" },
      { label: "Oscuro", value: "dark" },
    ],
  },
  {
    category: "commerce",
    key: "cartTtlMinutes",
    label: "TTL de carrito",
    description: "Cantidad de minutos que un carrito activo permanece vigente desde su última actividad.",
    kind: "number",
    defaultValue: 120,
    min: 15,
    max: 1440,
    step: 15,
  },
  {
    category: "commerce",
    key: "defaultLowStockThreshold",
    label: "Umbral bajo stock",
    description: "Umbral por defecto para advertencias de inventario si el producto no define uno propio.",
    kind: "number",
    defaultValue: 10,
    min: 0,
    max: 1000,
    step: 1,
  },
  {
    category: "commerce",
    key: "defaultCouponValidityDays",
    label: "Vigencia por defecto de cupones",
    description: "Días de validez sugeridos para nuevos cupones promocionales.",
    kind: "number",
    defaultValue: 90,
    min: 1,
    max: 365,
    step: 1,
  },
  {
    category: "commerce",
    key: "guestCheckoutEnabled",
    label: "Checkout invitado",
    description: "Permite comprar sin cuenta usando el flujo de invitado.",
    kind: "boolean",
    defaultValue: true,
  },
  {
    category: "sizing",
    key: "womenSizeMapJson",
    label: "Mapa de talles mujer",
    description: "JSON interno con la relación número -> S/M/L/- para mujer.",
    kind: "textarea",
    defaultValue: JSON.stringify(createDefaultProductSizingMatrix().mujer, null, 2),
  },
  {
    category: "sizing",
    key: "menSizeMapJson",
    label: "Mapa de talles hombre",
    description: "JSON interno con la relación número -> S/M/L/- para hombre.",
    kind: "textarea",
    defaultValue: JSON.stringify(createDefaultProductSizingMatrix().hombre, null, 2),
  },
  {
    category: "payments",
    key: "defaultPaymentProvider",
    label: "Pasarela por defecto",
    description: "Proveedor que se selecciona por defecto en checkout.",
    kind: "select",
    defaultValue: "MERCADOPAGO",
    options: [
      { label: "MercadoPago", value: "MERCADOPAGO" },
      { label: "Transferencia", value: "TRANSFERENCIA" },
      { label: "PayPal", value: "PAYPAL" },
    ],
  },
  {
    category: "payments",
    key: "mercadopagoEnabled",
    label: "MercadoPago habilitado",
    description: "Muestra la pasarela de MercadoPago para pagos en ARS.",
    kind: "boolean",
    defaultValue: true,
  },
  {
    category: "payments",
    key: "transferEnabled",
    label: "Transferencia habilitada",
    description: "Muestra la opción de transferencia bancaria como método manual.",
    kind: "boolean",
    defaultValue: true,
  },
  {
    category: "payments",
    key: "paypalEnabled",
    label: "PayPal habilitado",
    description: "Muestra la pasarela de PayPal para cobros en USD.",
    kind: "boolean",
    defaultValue: false,
  },
  {
    category: "notifications",
    key: "orderAlertsEnabled",
    label: "Alertas de pedidos",
    description: "Activa el envío de alertas operativas por nuevas órdenes.",
    kind: "boolean",
    defaultValue: true,
  },
  {
    category: "notifications",
    key: "lowStockAlertsEnabled",
    label: "Alertas de stock bajo",
    description: "Activa alertas internas cuando el stock cae por debajo del umbral.",
    kind: "boolean",
    defaultValue: true,
  },
  {
    category: "notifications",
    key: "recoveryEmailsEnabled",
    label: "Correos de recuperación",
    description: "Permite enviar recordatorios de carrito y recuperación de acceso.",
    kind: "boolean",
    defaultValue: true,
  },
  {
    category: "notifications",
    key: "opsEmail",
    label: "Email operativo",
    description: "Buzón donde se concentran notificaciones internas críticas.",
    kind: "email",
    defaultValue: "ops@starfeet.ar",
  },
  {
    category: "security",
    key: "adminSessionDays",
    label: "Duración de sesión admin",
    description: "Cantidad de días que dura la sesión administrativa por defecto.",
    kind: "number",
    defaultValue: 30,
    min: 1,
    max: 90,
    step: 1,
  },
  {
    category: "security",
    key: "minPasswordLength",
    label: "Longitud mínima de contraseña",
    description: "Longitud mínima sugerida para nuevos usuarios y reseteos.",
    kind: "number",
    defaultValue: 8,
    min: 8,
    max: 32,
    step: 1,
  },
  {
    category: "security",
    key: "authLockoutEnabled",
    label: "Bloqueo por intentos",
    description: "Habilita bloqueo temporal tras múltiples intentos fallidos.",
    kind: "boolean",
    defaultValue: true,
  },
  {
    category: "security",
    key: "maxLoginAttempts",
    label: "Intentos máximos de login",
    description: "Cantidad de intentos fallidos antes de activar el bloqueo.",
    kind: "number",
    defaultValue: 5,
    min: 1,
    max: 20,
    step: 1,
  },
] as const;

export type AdminSettingKey = (typeof ADMIN_SETTING_DEFINITIONS)[number]["key"];

export const ADMIN_SETTING_DEFINITIONS_BY_CATEGORY = ADMIN_SETTING_CATEGORIES.reduce(
  (acc, category) => {
    acc[category] = ADMIN_SETTING_DEFINITIONS.filter((definition) => definition.category === category);
    return acc;
  },
  {} as Record<AdminSettingCategory, AdminSettingDefinition[]>,
);

export const ADMIN_SETTING_CATEGORIES_META: Record<
  AdminSettingCategory,
  { title: string; description: string }
> = {
  general: {
    title: "General",
    description: "Datos base de la operación, contacto y localización.",
  },
  appearance: {
    title: "Apariencia",
    description: "Tema visual y presentación del backoffice.",
  },
  sizing: {
    title: "Talles",
    description: "Mapeo numérico por género para talles S/M/L y números inexistentes.",
  },
  commerce: {
    title: "Comercio",
    description: "Reglas de carrito, stock, cupones y checkout.",
  },
  payments: {
    title: "Pagos",
    description: "Métodos de cobro y proveedor por defecto.",
  },
  notifications: {
    title: "Notificaciones",
    description: "Alertas internas, correos y flujos operativos.",
  },
  security: {
    title: "Seguridad",
    description: "Políticas de acceso y endurecimiento de autenticación.",
  },
};

export const ADMIN_SETTING_DEFAULTS = ADMIN_SETTING_DEFINITIONS.reduce(
  (acc, def) => {
    if (!acc[def.category]) {
      acc[def.category] = {};
    }
    acc[def.category][def.key] = def.defaultValue;
    return acc;
  },
  {} as Record<AdminSettingCategory, Record<string, AdminSettingValue>>,
);

export function getAdminSettingDefinition(category: AdminSettingCategory, key: string) {
  return ADMIN_SETTING_DEFINITIONS.find((definition) => definition.category === category && definition.key === key);
}

export function getActivePaymentProviders(settings: Partial<Record<string, AdminSettingValue>>) {
  const enabled = [];
  if (settings.mercadopagoEnabled !== false) enabled.push("MERCADOPAGO");
  if (settings.transferEnabled !== false) enabled.push("TRANSFERENCIA");
  if (settings.paypalEnabled === true) enabled.push("PAYPAL");
  return enabled;
}

export function buildAdminSettingsState() {
  return ADMIN_SETTING_CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = { ...ADMIN_SETTING_DEFAULTS[category] };
      return acc;
    },
    {} as Record<AdminSettingCategory, Record<string, AdminSettingValue>>,
  );
}
