import { useState } from "react";
import { Image } from "@unpic/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import {
  Trash2,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
} from "@kioskfy/ui";
import { useSession, initAuth } from "@kioskfy/auth-client";
import type { BatchOrderInput } from "@kioskfy/types";
import type { PispiCheckoutCloseResult } from "@pi-spi/checkout";
import { api, API_ORIGIN } from "@/lib/api";
import { cartStore, useCartStore } from "@/lib/cart-store";
import { priceFormatter } from "@/lib/price-formatter";
import { FrequencyContent } from "@/components/frequency-content";
import { PispiCheckout } from "@/components/payment/pispi-checkout";

// Initialize the auth client once (idempotent — the session promise is cached).
if (typeof window !== "undefined") {
  initAuth({ baseURL: API_ORIGIN, basePath: "/api/auth" });
}

export function Cart() {
  const navigate = useNavigate();
  const items = useCartStore();
  const { isAuthenticated } = useSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createBatch = useMutation({
    mutationFn: (data: BatchOrderInput) => api.orders.createBatch(data),
  });

  const updatePaymentId = useMutation({
    mutationFn: ({
      orderIds,
      paymentId,
    }: {
      orderIds: string[];
      paymentId: string;
    }) => api.orders.updatePaymentId(orderIds, paymentId),
  });

  /** Crée les commandes pour le parcours PI-SPI. */
  const createOrdersForPispi = async () => {
    if (items.length === 0) {
      throw new Error("Votre panier est vide");
    }
    const createdOrders = await createBatch.mutateAsync({
      orders: items.map((item) => ({
        newspaperId: item.id,
        price: Number(item.price),
      })),
    });
    if (!createdOrders?.length) {
      throw new Error("Erreur lors de la création des commandes");
    }
    return { orderIds: createdOrders.map((order) => order.id) };
  };

  /** Fermeture du widget PI-SPI : succès, rejet ou abandon. */
  const handlePispiClose = (result: PispiCheckoutCloseResult) => {
    if (result.success && result.txId) {
      navigate({
        to: "/payment/success",
        search: { paymentId: result.txId } as never,
      });
    } else if (result.status === "rejected") {
      setErrorMessage("Le paiement PI-SPI a été rejeté. Veuillez réessayer.");
    } else if (result.status === "timeout") {
      setErrorMessage(
        "Le paiement PI-SPI a expiré. Vérifiez vos notifications avant de réessayer.",
      );
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-muted/50 p-6 rounded-full mb-6">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Votre panier est vide
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Il semble que vous n&apos;ayez pas encore ajouté de journaux ou
          magazines à votre panier.
        </p>
        <Button asChild size="lg">
          <Link to="/newspapers">Découvrir les journaux</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Votre Panier</h1>

      {errorMessage && (
        <div
          role="alert"
          className="mb-8 flex items-start gap-3 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const metadata = item.organization?.metadata;
            const frequency =
              metadata && typeof metadata !== "string"
                ? (metadata as Record<string, unknown>).frequency
                : undefined;

            return (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative w-full sm:w-32 aspect-3/4 sm:aspect-auto">
                    <Image
                      src={item.coverImage}
                      alt={item.issueNumber}
                      width={128}
                      height={176}
                      className="object-cover m-2"
                    />
                  </div>
                  <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          {item.issueNumber}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          {item.organization?.name}
                        </p>
                        {typeof frequency === "string" && (
                          <Badge variant="outline">
                            <FrequencyContent frequency={frequency} />
                          </Badge>
                        )}
                      </div>
                      <p className="font-bold text-lg">
                        {priceFormatter(
                          item.price,
                          item.country?.currency,
                          "fr",
                        )}
                      </p>
                    </div>

                    <div className="flex justify-between items-end mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 -ml-2"
                        onClick={() => cartStore.removeItem(item.id)}
                      >
                        <Trash2 data-icon="inline-start" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-4">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Résumé de la commande</CardTitle>
              <CardDescription>
                {items.length} article{items.length > 1 ? "s" : ""} dans votre
                panier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>
                    {priceFormatter(
                      cartStore.total(),
                      items[0]?.country?.currency,
                      "fr",
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">
                    {priceFormatter(
                      cartStore.total(),
                      items[0]?.country?.currency,
                      "fr",
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <div className="flex w-full flex-col gap-2">
                <p className="text-center text-xs text-muted-foreground">
                  Payez en toute sécurité avec PI-SPI
                </p>
                {isAuthenticated ? (
                  <PispiCheckout
                    amount={Math.round(cartStore.total())}
                    motif={`Achat de ${items.length} journal(aux) sur Kioskfy`}
                    createOrders={createOrdersForPispi}
                    linkOrdersToPayment={(orderIds, paymentId) =>
                      updatePaymentId.mutateAsync({ orderIds, paymentId })
                    }
                    onClose={handlePispiClose}
                  />
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate({
                        to: "/login",
                        search: { redirect: "/cart" } as never,
                      });
                    }}
                  >
                    Se connecter pour payer avec PI-SPI
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
