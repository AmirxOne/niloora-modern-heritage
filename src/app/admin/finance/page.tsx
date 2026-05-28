import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminFinancePanel } from "@/components/admin/AdminFinancePanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

export default function AdminFinancePage() {
  const redirectTo = "/admin/finance";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-4xl">
            <AdminPageHeader
              title={fa.admin.finance.title}
              subtitle={fa.admin.finance.subtitle}
            />
            <AdminFinancePanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
