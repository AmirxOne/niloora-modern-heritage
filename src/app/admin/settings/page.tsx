import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";
import { fa } from "@/lib/i18n/fa";

export default function AdminSettingsPage() {
  const redirectTo = "/admin/settings";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-3xl">
            <AdminPageHeader
              title={fa.admin.settings.title}
              subtitle={fa.admin.settings.subtitle}
            />
            <AdminSettingsPanel />
          </div>
      </AdminGuard>
  );
}
