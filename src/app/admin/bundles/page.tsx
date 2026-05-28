import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminBundlesPanel } from "@/components/admin/AdminBundlesPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

export default function AdminBundlesPage() {
  const redirectTo = "/admin/bundles";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-6xl">
            <AdminPageHeader
              title={fa.admin.bundles.title}
              subtitle={fa.admin.bundles.subtitle}
            />
            <AdminBundlesPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
