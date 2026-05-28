import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

export default function AdminSettingsPage() {
  const redirectTo = "/admin/settings";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-3xl">
            <AdminPageHeader
              title={fa.admin.settings.title}
              subtitle={fa.admin.settings.subtitle}
            />
            <AdminSettingsPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
