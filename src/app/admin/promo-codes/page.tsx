import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPromoCodesPanel } from "@/components/admin/AdminPromoCodesPanel";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

export default function AdminPromoCodesPage() {
  const redirectTo = "/admin/promo-codes";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-4xl">
            <AdminPageHeader
              title={fa.admin.promoCodes.title}
              subtitle={fa.admin.promoCodes.subtitle}
            />
            <AdminPromoCodesPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
