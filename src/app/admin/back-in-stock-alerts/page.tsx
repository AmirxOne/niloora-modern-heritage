import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminBackInStockAlertsPanel } from "@/components/admin/AdminBackInStockAlertsPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fa } from "@/lib/i18n/fa";

export default function AdminBackInStockAlertsPage() {
  const redirectTo = "/admin/back-in-stock-alerts";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-6xl">
            <AdminPageHeader
              title={fa.admin.backInStockAlerts.title}
              subtitle={fa.admin.backInStockAlerts.subtitle}
            />
            <AdminBackInStockAlertsPanel />
          </div>
      </AdminGuard>
  );
}
