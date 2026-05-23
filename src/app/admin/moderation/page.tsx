import Link from "next/link";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { CommentModeration } from "@/components/dashboard/CommentModeration";
import { ProductQuestionsModeration } from "@/components/dashboard/ProductQuestionsModeration";
import { PageTransition } from "@/components/layout/PageTransition";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { fa } from "@/lib/i18n/fa";

export default function AdminModerationPage() {
  const redirectTo = "/admin/moderation";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-6xl space-y-8">
            <header className="admin-page-header">
              <span className="heritage-eyebrow">{fa.admin.eyebrow}</span>
              <h1 className="admin-page-title">{fa.admin.moderation.title}</h1>
              <p className="admin-page-subtitle">{fa.admin.moderation.subtitle}</p>
              <OrnamentalDivider className="mx-auto my-5 max-w-[12rem]" />
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/admin/home" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.home.navLabel}
                </Link>
                <Link href="/admin/orders" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.orders.navLabel}
                </Link>
                <Link href="/admin/products" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.products.navLabel}
                </Link>
                <Link href="/admin/support-requests" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.supportRequests.navLabel}
                </Link>
                <Link href="/account" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.backToAccount}
                </Link>
              </div>
            </header>

            <section>
              <CommentModeration />
            </section>

            <section>
              <ProductQuestionsModeration />
            </section>
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
