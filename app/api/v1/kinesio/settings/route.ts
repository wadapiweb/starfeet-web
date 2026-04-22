import { NextResponse } from "next/server";

import { jsonError, parseJson } from "@/lib/api";
import { requireSessionUser } from "@/lib/authz";
import { getKinesioSettings, upsertKinesioSettings } from "@/lib/kinesio-settings.server";

type PatchSettingsBody = Partial<{
  dashboardRangeDays: number;
  tableDensity: "comfortable" | "compact";
  showQuickTips: boolean;
  autoRefreshMinutes: number;
}>;

export async function GET() {
  try {
    const user = await requireSessionUser();
    const settings = await getKinesioSettings(user.id);
    return NextResponse.json({ settings });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await parseJson<PatchSettingsBody>(request);
    const settings = await upsertKinesioSettings(user.id, body, user.id);
    return NextResponse.json({ settings });
  } catch (error) {
    return jsonError(error);
  }
}
