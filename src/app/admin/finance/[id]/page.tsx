import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminFinanceDetailPanel } from "@/components/admin/AdminFinanceDetailPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fa } from "@/lib/i18n/fa";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminFinanceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const redirectTo = `/admin/finance/${id}`;

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl">
            <AdminPageHeader
              title={fa.admin.finance.detailTitle}
              subtitle={<span dir="ltr">{id}</span>}
            />
            <AdminFinanceDetailPanel paymentId={id} />
          </div>
      </AdminGuard>
  );
}
