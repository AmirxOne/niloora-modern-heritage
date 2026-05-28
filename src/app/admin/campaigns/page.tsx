import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminCampaignsPanel } from "@/components/admin/AdminCampaignsPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

export default function AdminCampaignsPage() {
  return (
    <AdminGuard redirectTo="/admin/campaigns">
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-4xl">
            <AdminPageHeader
              title={fa.admin.campaigns.title}
              subtitle={fa.admin.campaigns.subtitle}
            />
            <AdminCampaignsPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
