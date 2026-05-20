import { NextResponse } from "next/server";
import { ApiError, requireRole } from "@/lib/authz";
import {
  ADMIN_SETTING_CATEGORIES,
  ADMIN_SETTING_CATEGORIES_META,
  ADMIN_SETTING_DEFINITIONS_BY_CATEGORY,
  type AdminSettingCategory,
} from "@/lib/admin-settings";
import { getAdminSettingsSnapshot, upsertAdminSettingsCategory } from "@/lib/admin-settings.server";
import { jsonError, parseJson } from "@/lib/api";

type PatchBody = {
  category: AdminSettingCategory;
  values: Record<string, unknown>;
};

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const settings = await getAdminSettingsSnapshot();

    return NextResponse.json({
      settings,
      categories: ADMIN_SETTING_CATEGORIES_META,
      definitions: ADMIN_SETTING_DEFINITIONS_BY_CATEGORY,
      availableCategories: ADMIN_SETTING_CATEGORIES,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const body = await parseJson<PatchBody>(request);

    if (!body.category || !ADMIN_SETTING_CATEGORIES.includes(body.category)) {
      throw new ApiError(400, "Categoría inválida");
    }
    if (!body.values || typeof body.values !== "object" || Array.isArray(body.values)) {
      throw new ApiError(400, "Los valores enviados no son válidos");
    }

    const settings = await upsertAdminSettingsCategory(body.category, body.values, admin.id);

    return NextResponse.json({
      ok: true,
      category: body.category,
      settings,
    });
  } catch (error) {
    return jsonError(error);
  }
}
