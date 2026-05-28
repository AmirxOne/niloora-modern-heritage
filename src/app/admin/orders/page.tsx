import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminOrdersPanel } from "@/components/admin/AdminOrdersPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

export default function AdminOrdersPage() {
  const redirectTo = "/admin/orders";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-4xl">
            <AdminPageHeader
              title={fa.admin.orders.title}
              subtitle={fa.admin.orders.subtitle}
            />
            <AdminOrdersPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
