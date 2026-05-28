import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminFinanceDetailPanel } from "@/components/admin/AdminFinanceDetailPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminFinanceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const redirectTo = `/admin/finance/${id}`;

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-4xl">
            <AdminPageHeader
              title={fa.admin.finance.detailTitle}
              subtitle={<span dir="ltr">{id}</span>}
            />
            <AdminFinanceDetailPanel paymentId={id} />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
