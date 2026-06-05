import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminFinancePanel } from "@/components/admin/AdminFinancePanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fa } from "@/lib/i18n/fa";

export default function AdminFinancePage() {
  const redirectTo = "/admin/finance";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl">
            <AdminPageHeader
              title={fa.admin.finance.title}
              subtitle={fa.admin.finance.subtitle}
            />
            <AdminFinancePanel />
          </div>
      </AdminGuard>
  );
}
