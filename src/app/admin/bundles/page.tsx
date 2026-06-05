import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminBundlesPanel } from "@/components/admin/AdminBundlesPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fa } from "@/lib/i18n/fa";

export default function AdminBundlesPage() {
  const redirectTo = "/admin/bundles";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-6xl">
            <AdminPageHeader
              title={fa.admin.bundles.title}
              subtitle={fa.admin.bundles.subtitle}
            />
            <AdminBundlesPanel />
          </div>
      </AdminGuard>
  );
}
