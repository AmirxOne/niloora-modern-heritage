import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminOrdersPanel } from "@/components/admin/AdminOrdersPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fa } from "@/lib/i18n/fa";

export default function AdminOrdersPage() {
  const redirectTo = "/admin/orders";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl">
            <AdminPageHeader
              title={fa.admin.orders.title}
              subtitle={fa.admin.orders.subtitle}
            />
            <AdminOrdersPanel />
          </div>
      </AdminGuard>
  );
}
