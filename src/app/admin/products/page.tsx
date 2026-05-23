import Link from "next/link";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminProductsPanel } from "@/components/admin/AdminProductsPanel";
import { PageTransition } from "@/components/layout/PageTransition";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { fa } from "@/lib/i18n/fa";

export default function AdminProductsPage() {
  const redirectTo = "/admin/products";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-6xl">
            <header className="admin-page-header">
              <span className="heritage-eyebrow">{fa.admin.eyebrow}</span>
              <h1 className="admin-page-title">{fa.admin.products.title}</h1>
              <p className="admin-page-subtitle">{fa.admin.products.subtitle}</p>
              <OrnamentalDivider className="mx-auto my-5 max-w-[12rem]" />
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/admin/orders" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.orders.navLabel}
                </Link>
                <Link href="/admin/home" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.home.navLabel}
                </Link>
                <Link href="/admin/trade-in" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.tradeIn.navLabel}
                </Link>
                <Link
                  href="/admin/support-requests"
                  className="text-turquoise-dark hover:text-turquoise"
                >
                  {fa.admin.supportRequests.navLabel}
                </Link>
                <Link href="/admin/promo-codes" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.promoCodes.navLabel}
                </Link>
                <Link href="/admin/moderation" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.moderation.navLabel}
                </Link>
                <Link href="/account" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.backToAccount}
                </Link>
              </div>
            </header>
            <AdminProductsPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
