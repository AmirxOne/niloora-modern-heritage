import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminReturnsPanel } from "@/components/admin/AdminReturnsPanel";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

export default function AdminReturnsPage() {
  const redirectTo = "/admin/returns";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-4xl">
            <AdminPageHeader
              title={fa.admin.returns.title}
              subtitle={fa.admin.returns.subtitle}
            />
            <AdminReturnsPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
