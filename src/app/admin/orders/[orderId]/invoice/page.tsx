import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminOrderInvoicePageContent } from "@/components/admin/AdminOrderInvoicePageContent";

type PageProps = {
  params: { orderId: string };
};

export default function AdminOrderInvoicePage({ params }: PageProps) {
  const redirectTo = `/admin/orders/${params.orderId}/invoice`;

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl admin-order-invoice-shell">
            <AdminOrderInvoicePageContent orderId={params.orderId} />
          </div>
      </AdminGuard>
  );
}
