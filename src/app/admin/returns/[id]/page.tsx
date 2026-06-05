import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminReturnDetailPanel } from "@/components/admin/AdminReturnDetailPanel";
import { fa } from "@/lib/i18n/fa";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminReturnDetailPage({ params }: PageProps) {
  const { id } = await params;
  const redirectTo = `/admin/returns/${id}`;

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl">
            <AdminPageHeader
              title={fa.admin.returns.detailTitle}
              subtitle={<span dir="ltr">{id}</span>}
            />
            <AdminReturnDetailPanel returnId={id} />
          </div>
      </AdminGuard>
  );
}
