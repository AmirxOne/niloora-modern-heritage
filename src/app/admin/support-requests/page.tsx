import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSupportRequestsPanel } from "@/components/admin/AdminSupportRequestsPanel";
import { fa } from "@/lib/i18n/fa";

export default function AdminSupportRequestsPage() {
  const redirectTo = "/admin/support-requests";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div>
          <AdminPageHeader
            title={fa.admin.supportRequests.title}
            subtitle={fa.admin.supportRequests.subtitle}
          />
          <AdminSupportRequestsPanel />
        </div>
    </AdminGuard>
  );
}
