import { Suspense, useEffect, useCallback, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Newspaper,
  ArrowRight,
  Download,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kioskfy/ui";
import { api } from "@/lib/api";
import { cartStore } from "@/lib/cart-store";
import { usePaymentStore } from "@/lib/payment-store";
import {
  useVerifyPayment,
  useConfirmPispiPayment,
} from "@/hooks/use-payment.hook";

export function PaymentSuccessContent({
  urlPaymentId,
}: {
  urlPaymentId?: string;
}) {
  const { paymentId: storePaymentId, setPaymentId, clearPaymentId } =
    usePaymentStore();

  // Use URL payment ID as fallback if store doesn't have it (direct redirect from payment gateway)
  const effectivePaymentId = storePaymentId || urlPaymentId || "";

  // PI-SPI transactions use a `RTP-` prefixed id and are confirmed via the
  // SaaS API instead of Moneroo.
  const isPispi = effectivePaymentId.startsWith("RTP-");

  // Sync URL payment ID to store on mount if store is empty
  useEffect(() => {
    if (urlPaymentId && !storePaymentId) {
      setPaymentId(urlPaymentId);
    }
  }, [urlPaymentId, storePaymentId, setPaymentId]);

  const { paymentVerify } = useVerifyPayment(
    isPispi ? null : effectivePaymentId || null,
  );
  const { pispiConfirm } = useConfirmPispiPayment(
    isPispi ? effectivePaymentId : null,
  );

  const paymentId = effectivePaymentId;

  const isPaymentSuccessful = isPispi
    ? pispiConfirm?.success === true
    : paymentVerify?.data?.status === "success";

  const hasProcessedPayment = useRef(false);

  // Handle user phone update from the payment's customer info
  const handleUpdateUserPhone = useCallback(async () => {
    try {
      const phone = paymentVerify?.data?.customer?.phone;
      if (phone) {
        await api.users.updatePhone(phone);
      }
    } catch (error) {
      console.error("Error updating user phone:", error);
    }
  }, [paymentVerify?.data?.customer?.phone]);

  // Handle payment success via the API (creates the revenue shares)
  const processPaymentSuccess = useCallback(async () => {
    if (!paymentId) return;

    try {
      await api.payments.success({ paymentId });
    } catch (error) {
      console.error("Error processing payment success:", error);
    }
  }, [paymentId]);

  // Clear cart and payment ID after successful payment
  useEffect(() => {
    if (isPaymentSuccessful && !hasProcessedPayment.current) {
      hasProcessedPayment.current = true;
      if (!isPispi) {
        handleUpdateUserPhone();
        processPaymentSuccess();
      }
      cartStore.clearCart();
      clearPaymentId();
    }
  }, [
    isPaymentSuccessful,
    isPispi,
    handleUpdateUserPhone,
    processPaymentSuccess,
    clearPaymentId,
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">
            Chargement...
          </div>
        </div>
      }
    >
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg text-center shadow-2xl border-0 bg-gradient-to-b from-background to-muted/20">
          {isPaymentSuccessful ? (
            <>
          <CardHeader className="space-y-6 pb-2">
            {/* Success Animation */}
            <div className="mx-auto relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6 shadow-lg shadow-green-500/30">
                <CheckCircle2
                  className="h-16 w-16 text-white"
                  strokeWidth={2.5}
                />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-6 w-6 text-yellow-400 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                Paiement réussi !
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Merci pour votre achat. Votre commande a été traitée avec
                succès.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* What's Next */}
            <div className="space-y-4 text-left bg-primary/5 rounded-xl p-4">
              <h3 className="font-semibold text-center">
                Que se passe-t-il maintenant ?
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 bg-primary/10 rounded-full p-1">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <span>
                    Vous recevrez un email de confirmation avec les détails de
                    votre commande.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 bg-primary/10 rounded-full p-1">
                    <Newspaper className="h-4 w-4 text-primary" />
                  </div>
                  <span>
                    Vos journaux sont maintenant disponibles dans votre espace
                    personnel.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 bg-primary/10 rounded-full p-1">
                    <Download className="h-4 w-4 text-primary" />
                  </div>
                  <span>
                    Vous pouvez les lire en ligne mais ne sont pas
                    téléchargeables.
                  </span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                asChild
                variant="outline"
                className="flex-1 rounded-full"
              >
                <Link to="/dashboard/achats">
                  <Newspaper data-icon="inline-start" />
                  Mes achats
                </Link>
              </Button>
              <Button
                asChild
                className="flex-1 rounded-full shadow-lg shadow-primary/25"
              >
                <Link to="/">
                  Continuer à explorer
                  <ArrowRight data-icon="inline-start" />
                </Link>
              </Button>
            </div>

            {/* Support */}
            <p className="text-xs text-muted-foreground pt-2">
              Une question ? Contactez notre{" "}
              <Link to="/support" className="text-primary hover:underline">
                support client
              </Link>
            </p>
          </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-6 pb-2">
                <div className="mx-auto relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative rounded-full bg-muted p-6">
                    <Loader2
                      className="h-16 w-16 text-primary animate-spin"
                      strokeWidth={2}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">
                    {isPispi
                      ? "Paiement en cours de confirmation"
                      : "Vérification du paiement"}
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    {isPispi
                      ? "Nous vérifions le statut de votre paiement PI-SPI auprès de la plateforme. Cette vérification peut prendre quelques secondes."
                      : "Nous vérifions votre paiement. Cette vérification peut prendre quelques secondes."}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {isPispi &&
                pispiConfirm &&
                !pispiConfirm.success &&
                pispiConfirm.statut &&
                ["REJETE", "REJETEE", "ANNULE"].includes(
                  pispiConfirm.statut.toUpperCase(),
                ) ? (
                  <p className="text-sm text-destructive">
                    Le paiement a été refusé. Veuillez réessayer ou contacter
                    le support.
                  </p>
                ) : null}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </Suspense>
  );
}
