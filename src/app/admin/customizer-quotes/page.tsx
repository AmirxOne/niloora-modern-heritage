import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminCustomizerQuotesPanel } from "@/components/admin/AdminCustomizerQuotesPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

export default function AdminCustomizerQuotesPage() {
  const redirectTo = "/admin/customizer-quotes";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-6xl space-y-8">
            <AdminPageHeader
              title={fa.customize.liveTimeline.admin.title}
              subtitle={fa.customize.liveTimeline.admin.subtitle}
            />

            <AdminCustomizerQuotesPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
