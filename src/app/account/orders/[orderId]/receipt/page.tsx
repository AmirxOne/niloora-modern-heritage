import { AuthGuard } from "@/components/auth/AuthGuard";
import { OrderReceiptPageContent } from "@/components/orders/OrderReceiptPageContent";
import { PageTransition } from "@/components/layout/PageTransition";

type PageProps = {
  params: { orderId: string };
};

export default function OrderReceiptPage({ params }: PageProps) {
  const redirectTo = `/account/orders/${params.orderId}/receipt`;

  return (
    <AuthGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-3xl">
            <OrderReceiptPageContent orderId={params.orderId} />
          </div>
        </div>
      </PageTransition>
    </AuthGuard>
  );
}
