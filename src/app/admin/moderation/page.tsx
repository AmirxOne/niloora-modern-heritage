import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CommentModeration } from "@/components/moderation/CommentModeration";
import { ProductQuestionsModeration } from "@/components/moderation/ProductQuestionsModeration";
import { UgcModeration } from "@/components/moderation/UgcModeration";
import { fa } from "@/lib/i18n/fa";

export default function AdminModerationPage() {
  const redirectTo = "/admin/moderation";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-6xl space-y-8">
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
      </AdminGuard>
  );
}
