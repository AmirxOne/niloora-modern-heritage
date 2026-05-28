import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminMediaPicker } from "@/components/admin/AdminMediaPicker";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageTransition } from "@/components/layout/PageTransition";

export default function AdminMediaPage() {
  return (
    <AdminGuard redirectTo="/admin/media">
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-5xl">
            <AdminPageHeader
              title="مدیریت رسانه"
              subtitle="آپلود تصویر، دسته‌بندی، انتخاب لینک برای فرم‌ها و خروجی WebP بهینه."
            />

            <section className="admin-order-card">
              <AdminMediaPicker
                category="general"
                label="باز کردن مدیا منیجر"
                onPick={() => undefined}
              />
            </section>
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
