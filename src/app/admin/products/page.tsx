import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminProductsPanel } from "@/components/admin/AdminProductsPanel";
import { fa } from "@/lib/i18n/fa";

export default function AdminProductsPage() {
  const redirectTo = "/admin/products";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-6xl">
            <AdminPageHeader
              title={fa.admin.products.title}
              subtitle={fa.admin.products.subtitle}
            />
            <AdminProductsPanel />
          </div>
      </AdminGuard>
  );
}
