import Link from "next/link";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSellersPanel } from "@/components/admin/AdminSellersPanel";
import { PageTransition } from "@/components/layout/PageTransition";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { fa } from "@/lib/i18n/fa";

export default function AdminSellersPage() {
  const redirectTo = "/admin/sellers";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-4xl">
            <header className="admin-page-header">
              <span className="heritage-eyebrow">{fa.admin.eyebrow}</span>
              <h1 className="admin-page-title">{fa.admin.sellers.title}</h1>
              <p className="admin-page-subtitle">{fa.admin.sellers.subtitle}</p>
              <OrnamentalDivider className="mx-auto my-5 max-w-[12rem]" />
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/admin/orders" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.orders.navLabel}
                </Link>
                <Link href="/admin/products" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.products.navLabel}
                </Link>
                <Link href="/admin/users" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.users.navLabel}
                </Link>
                <Link href="/admin/home" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.home.navLabel}
                </Link>
                <Link href="/account" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.backToAccount}
                </Link>
              </div>
            </header>
            <AdminSellersPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
