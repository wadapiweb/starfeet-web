import "server-only";

import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/authz";
import { Prisma } from "@prisma/client";
import {
  ADMIN_SETTING_CATEGORIES,
  ADMIN_SETTING_DEFINITIONS,
  ADMIN_SETTING_DEFINITIONS_BY_CATEGORY,
  ADMIN_SETTING_DEFAULTS,
  type AdminSettingCategory,
  type AdminSettingDefinition,
  type AdminSettingValue,
  buildAdminSettingsState,
  getActivePaymentProviders,
} from "@/lib/admin-settings";
import {
  createDefaultProductSizingMatrix,
  parseProductSizingGenderMap,
  type ProductSizingMatrix,
} from "@/lib/product-sizing";

type SystemSettingRecord = {
  category: AdminSettingCategory;
  key: string;
  value: Prisma.JsonValue;
};

type AdminSettingsSnapshot = ReturnType<typeof buildAdminSettingsState>;

function getSettingDefinitionOrThrow(category: AdminSettingCategory, key: string): AdminSettingDefinition {
  const definition = ADMIN_SETTING_DEFINITIONS.find((item) => item.category === category && item.key === key);

  if (!definition) {
    throw new ApiError(400, `Setting desconocido: ${category}.${key}`);
  }

  return definition;
}

function normalizeString(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function normalizeValue(definition: AdminSettingDefinition, value: unknown): AdminSettingValue {
  switch (definition.kind) {
    case "boolean": {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        if (value === "true") return true;
        if (value === "false") return false;
      }
      throw new ApiError(400, `Valor inválido para ${definition.label}`);
    }
    case "number": {
      const numericValue =
        typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

      if (!Number.isFinite(numericValue)) {
        throw new ApiError(400, `Valor numérico inválido para ${definition.label}`);
      }

      const integerValue = definition.step && definition.step >= 1 ? Math.round(numericValue) : numericValue;
      if (definition.min !== undefined && integerValue < definition.min) {
        throw new ApiError(400, `${definition.label} debe ser mayor o igual a ${definition.min}`);
      }
      if (definition.max !== undefined && integerValue > definition.max) {
        throw new ApiError(400, `${definition.label} debe ser menor o igual a ${definition.max}`);
      }
      return integerValue;
    }
    case "select": {
      const normalized = normalizeString(value);
      if (!normalized) {
        throw new ApiError(400, `Valor inválido para ${definition.label}`);
      }
      if (!definition.options?.some((option) => option.value === normalized)) {
        throw new ApiError(400, `Opción inválida para ${definition.label}`);
      }
      return normalized;
    }
    case "email":
    case "text":
    case "textarea": {
      const normalized = normalizeString(value);
      if (!normalized && definition.kind !== "textarea") {
        throw new ApiError(400, `${definition.label} es obligatorio`);
      }
      return normalized;
    }
    default:
      return normalizeString(value);
  }
}

function normalizeStoredValue(definition: AdminSettingDefinition, value: Prisma.JsonValue): AdminSettingValue {
  if (definition.kind === "boolean" && typeof value === "boolean") return value;
  if (definition.kind === "number" && typeof value === "number") return value;
  if ((definition.kind === "text" || definition.kind === "email" || definition.kind === "textarea" || definition.kind === "select") && typeof value === "string") {
    return value;
  }

  return ADMIN_SETTING_DEFAULTS[definition.category][definition.key];
}

function buildSnapshotFromRecords(records: SystemSettingRecord[]): AdminSettingsSnapshot {
  const snapshot = buildAdminSettingsState();

  for (const record of records) {
    const definition = ADMIN_SETTING_DEFINITIONS.find(
      (item) => item.category === record.category && item.key === record.key,
    );

    if (!definition) continue;
    snapshot[record.category][record.key] = normalizeStoredValue(definition, record.value);
  }

  return snapshot;
}

export async function getAdminSettingsSnapshot(): Promise<AdminSettingsSnapshot> {
  const systemSettingDelegate = (prisma as typeof prisma & {
    systemSetting?: { findMany: typeof prisma.systemSetting.findMany };
  }).systemSetting;

  if (!systemSettingDelegate?.findMany) {
    return buildAdminSettingsState();
  }

  const records = await systemSettingDelegate.findMany({
    select: { category: true, key: true, value: true },
  });

  return buildSnapshotFromRecords(records as SystemSettingRecord[]);
}

export async function getAdminSettingsCategory(category: AdminSettingCategory) {
  const snapshot = await getAdminSettingsSnapshot();
  return snapshot[category];
}

export async function getAdminCommerceSettings() {
  const snapshot = await getAdminSettingsSnapshot();
  return {
    cartTtlMinutes: Number(snapshot.commerce.cartTtlMinutes),
    defaultLowStockThreshold: Number(snapshot.commerce.defaultLowStockThreshold),
    defaultCouponValidityDays: Number(snapshot.commerce.defaultCouponValidityDays),
    guestCheckoutEnabled: Boolean(snapshot.commerce.guestCheckoutEnabled),
  };
}

export async function getAdminPaymentSettings() {
  const snapshot = await getAdminSettingsSnapshot();
  const providers = getActivePaymentProviders(snapshot.payments);

  return {
    defaultPaymentProvider: String(snapshot.payments.defaultPaymentProvider),
    providers,
    enabled: {
      mercadopago: snapshot.payments.mercadopagoEnabled !== false,
      transfer: snapshot.payments.transferEnabled !== false,
      paypal: snapshot.payments.paypalEnabled === true,
    },
  };
}

export async function getAdminSizingSettings(): Promise<ProductSizingMatrix> {
  const snapshot = await getAdminSettingsSnapshot();
  const womenMap = parseProductSizingGenderMap(snapshot.sizing.womenSizeMapJson) ?? createDefaultProductSizingMatrix().mujer;
  const menMap = parseProductSizingGenderMap(snapshot.sizing.menSizeMapJson) ?? createDefaultProductSizingMatrix().hombre;
  return {
    mujer: womenMap,
    hombre: menMap,
  };
}

export async function getAdminSecuritySettings() {
  const snapshot = await getAdminSettingsSnapshot();

  return {
    minPasswordLength: Number(snapshot.security.minPasswordLength),
    adminSessionDays: Number(snapshot.security.adminSessionDays),
    authLockoutEnabled: Boolean(snapshot.security.authLockoutEnabled),
    maxLoginAttempts: Number(snapshot.security.maxLoginAttempts),
  };
}

export async function upsertAdminSettingsCategory(
  category: AdminSettingCategory,
  values: Record<string, unknown>,
  updatedById?: string,
) {
  if (!ADMIN_SETTING_CATEGORIES.includes(category)) {
    throw new ApiError(400, "Categoría de configuración inválida");
  }

  const normalizedEntries = Object.entries(values);
  if (normalizedEntries.length === 0) {
    throw new ApiError(400, "No hay valores para actualizar");
  }

  const systemSettingDelegate = (prisma as typeof prisma & {
    systemSetting?: { upsert: typeof prisma.systemSetting.upsert };
  }).systemSetting;

  if (!systemSettingDelegate?.upsert) {
    throw new ApiError(503, "La configuración aún no está disponible; reinicia el servidor de desarrollo");
  }

  const updates = normalizedEntries.map(([key, value]) => {
    const definition = getSettingDefinitionOrThrow(category, key);
    const normalizedValue = normalizeValue(definition, value);

    return systemSettingDelegate.upsert({
      where: {
        category_key: {
          category,
          key,
        },
      },
      update: {
        value: normalizedValue as Prisma.InputJsonValue,
        updatedById: updatedById ?? null,
      },
      create: {
        category,
        key,
        value: normalizedValue as Prisma.InputJsonValue,
        updatedById: updatedById ?? null,
      },
    });
  });

  await prisma.$transaction(updates);
  return getAdminSettingsCategory(category);
}

export function getAdminSettingDefinition(category: AdminSettingCategory, key: string) {
  return getSettingDefinitionOrThrow(category, key);
}

export function getAdminSettingsDefinitionsForCategory(category: AdminSettingCategory) {
  return ADMIN_SETTING_DEFINITIONS_BY_CATEGORY[category];
}
