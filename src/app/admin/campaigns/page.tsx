import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminCampaignsPanel } from "@/components/admin/AdminCampaignsPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fa } from "@/lib/i18n/fa";

export default function AdminCampaignsPage() {
  return (
    <AdminGuard redirectTo="/admin/campaigns">
      <div className="max-w-4xl">
            <AdminPageHeader
              title={fa.admin.campaigns.title}
              subtitle={fa.admin.campaigns.subtitle}
            />
            <AdminCampaignsPanel />
          </div>
      </AdminGuard>
  );
}
