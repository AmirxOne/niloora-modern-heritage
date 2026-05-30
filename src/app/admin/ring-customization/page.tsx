import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRingCustomizationPanel } from "@/components/admin/AdminRingCustomizationPanel";
import { PageTransition } from "@/components/layout/PageTransition";

export default function AdminRingCustomizationPage() {
  return (
    <AdminGuard redirectTo="/admin/ring-customization">
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-5xl">
            <AdminPageHeader
              title="شخصی‌سازی خرید انگشتر"
              subtitle="تنظیمات محصول، whitelist و قیمت‌های پایه برای فلو checkout."
            />
            <AdminRingCustomizationPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}

