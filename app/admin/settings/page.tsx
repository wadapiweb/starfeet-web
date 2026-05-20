import { buildAdminSettingsState } from "@/lib/admin-settings";
import { getAdminSettingsSnapshot } from "@/lib/admin-settings.server";
import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";

export default async function AdminSettingsPage() {
  const settings = await getAdminSettingsSnapshot().catch((error) => {
    console.error("Admin settings fallback: database unavailable", error);
    return buildAdminSettingsState();
  });

  return <AdminSettingsPanel initialSettings={settings} />;
}
