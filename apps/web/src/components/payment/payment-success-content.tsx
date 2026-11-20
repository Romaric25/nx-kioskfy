import { useEffect, useCallback, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Newspaper,
  ArrowRight,
  Download,
  Sparkles,
  Clock3,
  XCircle,
  RefreshCw,
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
import { useVerifyPayment } from "@/hooks/use-payment.hook";

/**
 * Page de confirmation de paiement.
 *
 * PI-SPI : le widget se ferme automatiquement dès IRREVOCABLE et transmet
 * `statut=SUCCES` dans l'URL. Dans ce cas la page affiche le succès
 * IMMÉDIATEMENT — aucune vérification réseau, aucun polling, aucun spinner.
 * La confirmation des commandes côté serveur reste garantie par le webhook
 * PI-SPI et la réconciliation périodique de l'API (indépendants de la page).
 *
 * Cas ambigus uniquement (fermeture manuelle, timeout, page rechargée sans
 * le flag) : un unique appel `GET /payments/statut/:id` décide. Tant que le
 * statut est EN_ATTENTE, un polling DISCRET (15 s, sans spinner) met la page
 * à jour toute seule dès la confirmation — sans intervention de l'utilisateur.
 */
export function PaymentSuccessContent({
  urlPaymentId,
  urlStatut,
}: {
  urlPaymentId?: string;
  urlStatut?: string;
}) {
  const { paymentId: storePaymentId, setPaymentId, clearPaymentId } =
    usePaymentStore();

  // Use URL payment ID as fallback if store doesn't have it (direct redirect from payment gateway)
  const effectivePaymentId = storePaymentId || urlPaymentId || "";

  // PI-SPI transactions use a `RTP-` prefixed id and are confirmed via the
  // SaaS API instead of Moneroo.
  const isPispi = effectivePaymentId.startsWith("RTP-");

  // Confirmation déjà obtenue côté plateforme (fermeture auto du widget sur
  // IRREVOCABLE) : succès immédiat, sans réseau.
  const confirmeParCheckout =
    isPispi && String(urlStatut ?? "").toUpperCase() === "SUCCES";

  // Sync URL payment ID to store on mount if store is empty
  useEffect(() => {
    if (urlPaymentId && !storePaymentId) {
      setPaymentId(urlPaymentId);
    }
  }, [urlPaymentId, storePaymentId, setPaymentId]);

  // Moneroo (non PI-SPI) : vérification ponctuelle, bouton « Vérifier »
  // manuel disponible en cas d'erreur.
  const { paymentVerify, refetch: refetchVerify } = useVerifyPayment(
    isPispi ? null : effectivePaymentId || null,
  );

  // PI-SPI sans confirmation du widget : un seul appel serveur consolide le
  // statut des commandes. Polling discret tant que EN_ATTENTE (mise à jour
  // automatique), stoppé dès COMPLETED / ECHEC / INTROUVABLE.
  const { data: statutPaiement, refetch: refetchStatut } = useQuery({
    queryKey: ["payment", "statut", effectivePaymentId],
    queryFn: () =>
      api.payments.getStatut(effectivePaymentId) as Promise<{
        success: boolean;
        statut: string;
        orderIds: string[];
      }>,
    enabled: isPispi && !confirmeParCheckout && !!effectivePaymentId,
    retry: 1,
    refetchInterval: (query) => {
      if (query.state.data?.success === true) return false;
      const statut = String(query.state.data?.statut ?? "").toUpperCase();
      if (["COMPLETED", "ECHEC", "INTROUVABLE"].includes(statut)) {
        return false;
      }
      return 15_000;
    },
    refetchIntervalInBackground: true,
  });

  const isPaymentSuccessful =
    confirmeParCheckout ||
    statutPaiement?.success === true ||
    (!isPispi && paymentVerify?.data?.status === "success");

  const pispiEnEchec =
    isPispi &&
    !confirmeParCheckout &&
    ["ECHEC", "INTROUVABLE"].includes(
      String(statutPaiement?.statut ?? "").toUpperCase(),
    );

  // Moneroo : échec uniquement si la plateforme répond « failed » ou
  // « cancelled ». En cas de statut « pending » ou d'erreur réseau, on
  // reste sur la carte d'attente calme (vérification manuelle possible).
  const statutMoneroo = paymentVerify?.data?.status;
  const monerooEnEchec =
    !isPispi && (statutMoneroo === "failed" || statutMoneroo === "cancelled");

  const afficherEchec = pispiEnEchec || monerooEnEchec;

  /** Re-vérifie le statut à la demande (bouton manuel). */
  const verifierMaintenant = () => {
    if (isPispi) {
      void refetchStatut();
    } else {
      void refetchVerify();
    }
  };

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
    if (!effectivePaymentId) return;

    try {
      await api.payments.success({ paymentId: effectivePaymentId });
    } catch (error) {
      console.error("Error processing payment success:", error);
    }
  }, [effectivePaymentId]);

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
                      Vous recevrez un email de confirmation avec les détails
                      de votre commande.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 bg-primary/10 rounded-full p-1">
                      <Newspaper className="h-4 w-4 text-primary" />
                    </div>
                    <span>
                      Vos journaux sont maintenant disponibles dans votre
                      espace personnel.
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
        ) : afficherEchec ? (
          <>
            <CardHeader className="space-y-6 pb-2">
              <div className="mx-auto relative">
                <div className="absolute inset-0 bg-destructive/15 rounded-full blur-2xl" />
                <div className="relative rounded-full bg-muted p-6">
                  <XCircle
                    className="h-16 w-16 text-destructive"
                    strokeWidth={1.75}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">
                  Paiement non abouti
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {pispiEnEchec &&
                  String(statutPaiement?.statut ?? "").toUpperCase() ===
                    "INTROUVABLE"
                    ? "Aucun paiement ne correspond à cette référence. Si vous venez de payer, patientez quelques instants puis vérifiez à nouveau."
                    : "Votre paiement n'a pas pu être confirmé. Aucun montant n'est débité — vous pouvez réessayer."}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  asChild
                  className="flex-1 rounded-full shadow-lg shadow-primary/25"
                >
                  <Link to="/cart">
                    Réessayer le paiement
                    <ArrowRight data-icon="inline-start" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={verifierMaintenant}
                >
                  <RefreshCw className="h-4 w-4" />
                  Vérifier à nouveau
                </Button>
              </div>

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
            {/* État d'attente calme : pas de spinner, la page se met à jour
                toute seule dès la confirmation (ou via le bouton). */}
            <CardHeader className="space-y-6 pb-2">
              <div className="mx-auto relative">
                <div className="absolute inset-0 bg-primary/15 rounded-full blur-2xl" />
                <div className="relative rounded-full bg-muted p-6">
                  <Clock3
                    className="h-16 w-16 text-primary"
                    strokeWidth={1.75}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">
                  {isPispi
                    ? "Paiement en cours de traitement"
                    : "Vérification du paiement"}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {isPispi
                    ? "Nous attendons la confirmation de votre paiement. Cette page se met à jour automatiquement : vos journaux apparaîtront dans « Mes achats » dès que ce sera fait."
                    : "Nous vérifions votre paiement. Cette vérification ne prend que quelques instants."}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
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
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={verifierMaintenant}
                >
                  <RefreshCw className="h-4 w-4" />
                  Vérifier maintenant
                </Button>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                Pas besoin de rafraîchir la page. Une question ? Contactez
                notre{" "}
                <Link to="/support" className="text-primary hover:underline">
                  support client
                </Link>
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
