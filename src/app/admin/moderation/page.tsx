import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CommentModeration } from "@/components/dashboard/CommentModeration";
import { ProductQuestionsModeration } from "@/components/dashboard/ProductQuestionsModeration";
import { UgcModeration } from "@/components/dashboard/UgcModeration";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

export default function AdminModerationPage() {
  const redirectTo = "/admin/moderation";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-6xl space-y-8">
            <AdminPageHeader
              title={fa.admin.moderation.title}
              subtitle={fa.admin.moderation.subtitle}
            />

            <section>
              <CommentModeration />
            </section>

            <section>
              <ProductQuestionsModeration />
            </section>

            <section>
              <UgcModeration />
            </section>
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
