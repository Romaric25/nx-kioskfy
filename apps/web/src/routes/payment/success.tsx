import { createFileRoute, useSearch } from "@tanstack/react-router";
import { PaymentSuccessContent } from "@/components/payment/payment-success-content";

export const Route = createFileRoute("/payment/success")({
  component: PaymentSuccessPage,
  head: () => ({
    meta: [
      { title: "Paiement réussi | kioskfy" },
      { name: "description", content: "Paiement réussi - kioskfy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function PaymentSuccessPage() {
  const search = useSearch({ strict: false }) as Record<
    string,
    string | undefined
  >;
  return <PaymentSuccessContent urlPaymentId={search["paymentId"]} />;
}
