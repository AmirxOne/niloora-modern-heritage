import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPromoCodesPanel } from "@/components/admin/AdminPromoCodesPanel";
import { fa } from "@/lib/i18n/fa";

export default function AdminPromoCodesPage() {
  const redirectTo = "/admin/promo-codes";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl">
            <AdminPageHeader
              title={fa.admin.promoCodes.title}
              subtitle={fa.admin.promoCodes.subtitle}
            />
            <AdminPromoCodesPanel />
          </div>
      </AdminGuard>
  );
}
