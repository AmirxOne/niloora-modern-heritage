import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminProductsPanel } from "@/components/admin/AdminProductsPanel";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

export default function AdminProductsPage() {
  const redirectTo = "/admin/products";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-6xl">
            <AdminPageHeader
              title={fa.admin.products.title}
              subtitle={fa.admin.products.subtitle}
            />
            <AdminProductsPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
