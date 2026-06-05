import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminGiftCardsPanel } from "@/components/admin/AdminGiftCardsPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fa } from "@/lib/i18n/fa";

export default function AdminGiftCardsPage() {
  const redirectTo = "/admin/gift-cards";
  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl">
            <AdminPageHeader
              title={fa.admin.giftCards.title}
              subtitle={fa.admin.giftCards.subtitle}
            />
            <AdminGiftCardsPanel />
          </div>
      </AdminGuard>
  );
}
