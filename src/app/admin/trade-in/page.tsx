import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTradeInPanel } from "@/components/admin/AdminTradeInPanel";
import { fa } from "@/lib/i18n/fa";

export default function AdminTradeInPage() {
  const redirectTo = "/admin/trade-in";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl">
            <AdminPageHeader
              title={fa.admin.tradeIn.title}
              subtitle={fa.admin.tradeIn.subtitle}
            />
            <AdminTradeInPanel />
          </div>
      </AdminGuard>
  );
}
