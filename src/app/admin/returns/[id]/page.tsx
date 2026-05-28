import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminReturnDetailPanel } from "@/components/admin/AdminReturnDetailPanel";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminReturnDetailPage({ params }: PageProps) {
  const { id } = await params;
  const redirectTo = `/admin/returns/${id}`;

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-4xl">
            <AdminPageHeader
              title={fa.admin.returns.detailTitle}
              subtitle={<span dir="ltr">{id}</span>}
            />
            <AdminReturnDetailPanel returnId={id} />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
