import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminDemandWidget } from "@/components/admin/AdminDemandWidget";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fa } from "@/lib/i18n/fa";

export default function AdminDashboardPage() {
  return (
    <AdminGuard redirectTo="/admin">
      <div className="max-w-4xl">
        <AdminPageHeader
          title={fa.admin.dashboard.title}
          subtitle={fa.admin.dashboard.subtitle}
        />
        <AdminDemandWidget />
      </div>
    </AdminGuard>
  );
}
