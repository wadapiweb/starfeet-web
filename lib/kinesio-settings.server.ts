import "server-only";

import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/authz";
import { Prisma } from "@prisma/client";

export type KinesioSettings = {
  dashboardRangeDays: number;
  tableDensity: "comfortable" | "compact";
  showQuickTips: boolean;
  autoRefreshMinutes: number;
};

const KINESIO_SETTINGS_CATEGORY = "kinesio_preferences";

const DEFAULT_SETTINGS: KinesioSettings = {
  dashboardRangeDays: 30,
  tableDensity: "comfortable",
  showQuickTips: true,
  autoRefreshMinutes: 0,
};

function normalizeSettingsValue(value: Prisma.JsonValue | null | undefined): KinesioSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SETTINGS;
  }

  const record = value as Partial<KinesioSettings>;
  const dashboardRangeDays = Number(record.dashboardRangeDays);
  const tableDensity = record.tableDensity === "compact" ? "compact" : "comfortable";
  const showQuickTips = record.showQuickTips !== false;
  const autoRefreshMinutes = Number(record.autoRefreshMinutes);

  return {
    dashboardRangeDays: Number.isFinite(dashboardRangeDays) && dashboardRangeDays > 0 ? dashboardRangeDays : DEFAULT_SETTINGS.dashboardRangeDays,
    tableDensity,
    showQuickTips,
    autoRefreshMinutes: Number.isFinite(autoRefreshMinutes) && autoRefreshMinutes >= 0 ? autoRefreshMinutes : DEFAULT_SETTINGS.autoRefreshMinutes,
  };
}

export async function getKinesioSettings(userId: string): Promise<KinesioSettings> {
  const systemSettingDelegate = (prisma as typeof prisma & {
    systemSetting?: { findUnique: typeof prisma.systemSetting.findUnique };
  }).systemSetting;

  if (!systemSettingDelegate?.findUnique) {
    return DEFAULT_SETTINGS;
  }

  const record = await systemSettingDelegate.findUnique({
    where: {
      category_key: {
        category: KINESIO_SETTINGS_CATEGORY,
        key: userId,
      },
    },
    select: { value: true },
  });

  return normalizeSettingsValue(record?.value);
}

export async function upsertKinesioSettings(
  userId: string,
  values: Partial<KinesioSettings>,
  updatedById?: string,
): Promise<KinesioSettings> {
  const systemSettingDelegate = (prisma as typeof prisma & {
    systemSetting?: { upsert: typeof prisma.systemSetting.upsert };
  }).systemSetting;

  if (!systemSettingDelegate?.upsert) {
    throw new ApiError(503, "La configuración del kinesio no está disponible todavía");
  }

  const current = await getKinesioSettings(userId);
  const next: KinesioSettings = {
    dashboardRangeDays: Number(values.dashboardRangeDays ?? current.dashboardRangeDays),
    tableDensity: values.tableDensity === "compact" ? "compact" : "comfortable",
    showQuickTips: values.showQuickTips ?? current.showQuickTips,
    autoRefreshMinutes: Number(values.autoRefreshMinutes ?? current.autoRefreshMinutes),
  };

  if (!Number.isFinite(next.dashboardRangeDays) || next.dashboardRangeDays <= 0) {
    throw new ApiError(400, "Rango por defecto inválido");
  }
  if (!Number.isFinite(next.autoRefreshMinutes) || next.autoRefreshMinutes < 0) {
    throw new ApiError(400, "Intervalo de refresco inválido");
  }

  await systemSettingDelegate.upsert({
    where: {
      category_key: {
        category: KINESIO_SETTINGS_CATEGORY,
        key: userId,
      },
    },
    update: {
      value: next as Prisma.InputJsonValue,
      updatedById: updatedById ?? null,
    },
    create: {
      category: KINESIO_SETTINGS_CATEGORY,
      key: userId,
      value: next as Prisma.InputJsonValue,
      updatedById: updatedById ?? null,
    },
  });

  return next;
}

export function getDefaultKinesioSettings() {
  return DEFAULT_SETTINGS;
}
