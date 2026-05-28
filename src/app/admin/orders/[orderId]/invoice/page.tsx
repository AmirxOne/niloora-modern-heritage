import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminOrderInvoicePageContent } from "@/components/admin/AdminOrderInvoicePageContent";
import { PageTransition } from "@/components/layout/PageTransition";

type PageProps = {
  params: { orderId: string };
};

export default function AdminOrderInvoicePage({ params }: PageProps) {
  const redirectTo = `/admin/orders/${params.orderId}/invoice`;

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8 admin-order-invoice-shell">
          <div className="site-container max-w-4xl">
            <AdminOrderInvoicePageContent orderId={params.orderId} />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
