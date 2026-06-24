import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPendingProductsPanel } from "@/components/admin/AdminPendingProductsPanel";
import { fa } from "@/lib/i18n/fa";

export default function AdminPendingProductsPage() {
  const redirectTo = "/admin/products/pending";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl">
        <AdminPageHeader
          title={fa.admin.productsPending.title}
          subtitle={fa.admin.productsPending.subtitle}
        />
        <AdminPendingProductsPanel />
      </div>
    </AdminGuard>
  );
}
