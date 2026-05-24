import Link from "next/link";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { PageTransition } from "@/components/layout/PageTransition";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { AdminMediaPicker } from "@/components/admin/AdminMediaPicker";
import { fa } from "@/lib/i18n/fa";

export default function AdminMediaPage() {
  return (
    <AdminGuard redirectTo="/admin/media">
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-5xl">
            <header className="admin-page-header">
              <span className="heritage-eyebrow">{fa.admin.eyebrow}</span>
              <h1 className="admin-page-title">مدیریت رسانه</h1>
              <p className="admin-page-subtitle">
                آپلود تصویر، دسته‌بندی، انتخاب لینک برای فرم‌ها و خروجی WebP بهینه.
              </p>
              <OrnamentalDivider className="mx-auto my-5 max-w-[12rem]" />
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/admin/home" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.home.navLabel}
                </Link>
                <Link href="/admin/products" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.products.navLabel}
                </Link>
                <Link href="/admin/posts" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.posts.navLabel}
                </Link>
                <Link href="/account" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.backToAccount}
                </Link>
              </div>
            </header>

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
