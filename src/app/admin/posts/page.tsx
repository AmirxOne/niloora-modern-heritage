import { ContentWorkflowGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPostsPanel } from "@/components/admin/AdminPostsPanel";
import { fa } from "@/lib/i18n/fa";

export default function AdminPostsPage() {
  return (
    <ContentWorkflowGuard redirectTo="/admin/posts">
      <div className="max-w-4xl">
            <AdminPageHeader
              title={fa.admin.posts.pageTitle}
              subtitle={fa.admin.posts.subtitle}
            />
            <AdminPostsPanel />
          </div>
      </ContentWorkflowGuard>
  );
}
