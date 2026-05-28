import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTradeInPanel } from "@/components/admin/AdminTradeInPanel";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

export default function AdminTradeInPage() {
  const redirectTo = "/admin/trade-in";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-4xl">
            <AdminPageHeader
              title={fa.admin.tradeIn.title}
              subtitle={fa.admin.tradeIn.subtitle}
            />
            <AdminTradeInPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
