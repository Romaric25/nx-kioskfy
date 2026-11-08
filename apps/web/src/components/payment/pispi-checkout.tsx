import { useEffect, useRef } from "react";
import { mountCheckout } from "@pi-spi/checkout";
import type { PispiCheckoutCloseResult } from "@pi-spi/checkout";
import { createPispiPaymentRequest, getPispiPaymentStatus } from "@/lib/pispi";

export interface PispiCheckoutProps {
  /** Montant à payer, en F CFA. */
  amount: number;
  /** Motif affiché au payeur. */
  motif: string;
  /**
   * Crée les commandes kioskfy (et les lie au futur txId) — appelé quand le
   * payeur valide son alias dans le widget.
   */
  createOrders: () => Promise<{ orderIds: string[] }>;
  /** Lie les commandes au txId PI-SPI. */
  linkOrdersToPayment: (orderIds: string[], paymentId: string) => Promise<void>;
  /** Appelée à chaque fermeture du modal du widget. */
  onClose: (result: PispiCheckoutCloseResult) => void;
}

/**
 * Bouton « Payer avec PI-SPI » (librairie @pi-spi/checkout) branché sur
 * l'API SaaS PI-SPI. Le widget gère la saisie de l'alias, le polling du
 * statut et l'affichage de la facture.
 */
export function PispiCheckout({
  amount,
  motif,
  createOrders,
  linkOrdersToPayment,
  onClose,
}: PispiCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const createOrdersRef = useRef(createOrders);
  const linkOrdersRef = useRef(linkOrdersToPayment);
  onCloseRef.current = onClose;
  createOrdersRef.current = createOrders;
  linkOrdersRef.current = linkOrdersToPayment;

  useEffect(() => {
    if (!containerRef.current) return;

    const checkout = mountCheckout({
      container: containerRef.current,
      amount,
      motif,
      locale: "fr",
      buttonOptions: {
        theme: "marron",
        borderRadius: 8,
        fullWidth: true,
      },
      modalOptions: {
        type: "popupDialog",
        currencyLabel: "fcfa",
      },
      createPaymentRequest: async (payload) => {
        // 1. Créer les commandes kioskfy.
        const { orderIds } = await createOrdersRef.current();

        // 2. txId stable : il sert de paymentId côté kioskfy.
        // Contrainte du schéma PI-SPI : 35 caractères maximum.
        const txId = `RTP-${Date.now().toString(36)}${Math.random()
          .toString(36)
          .slice(2, 8)}`.slice(0, 35);
        await linkOrdersRef.current(orderIds, txId);

        // 3. Envoyer la demande de paiement à l'API SaaS PI-SPI.
        const demande = await createPispiPaymentRequest({
          txId,
          payeurAlias: payload.payeurAlias,
          montant: payload.montant,
          motif: payload.motif || motif,
        });

        return {
          txId: demande.txId || txId,
          statut: demande.statut,
          payeurNom: demande.payeurNom,
          payeurPays: demande.payeurPays,
        };
      },
      getPaymentStatus: (txId) => getPispiPaymentStatus(txId),
      onClose: (result) => onCloseRef.current(result),
    });

    return () => checkout.unmount();
  }, [amount, motif]);

  return <div ref={containerRef} className="w-full" />;
}
