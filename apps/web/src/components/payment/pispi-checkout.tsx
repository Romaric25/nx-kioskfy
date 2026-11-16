import { useEffect, useRef } from "react";
import { mountCheckout, isValidAlias } from "@pi-spi/checkout";
import type { PispiCheckoutCloseResult } from "@pi-spi/checkout";
import { createPispiPaymentRequest, getPispiPaymentStatus } from "@/lib/pispi";
import { api } from "@/lib/api";

export interface PispiCheckoutProps {
  /** Montant à payer, en F CFA. */
  amount: number;
  /** Motif affiché au payeur. */
  motif: string;
  /**
   * Alias PI-SPI (payeur) déjà connu du client : préremplit le champ
   * alias du modal à l'ouverture (le client peut toujours le modifier).
   */
  initialAlias?: string | null;
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

const MODAL_SELECTOR = 'div[data-pispi-checkout="modal"]';

/** Remplit le champ alias du modal PI-SPI (shadow DOM ouvert). */
function prefillModalAlias(alias: string): void {
  const host = document.body.querySelector<HTMLElement>(MODAL_SELECTOR);
  const input = host?.shadowRoot?.querySelector<HTMLInputElement>(
    'input:not([type="file"])',
  );
  if (!input) return;
  // Ne jamais écraser une saisie manuelle ou un scan QR.
  if (input.value.trim()) return;
  input.value = alias;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Bouton « Payer avec PI-SPI » (librairie @pi-spi/checkout) branché sur
 * l'API SaaS PI-SPI. Le widget gère la saisie de l'alias, le polling du
 * statut et l'affichage de la facture.
 *
 * `initialAlias` préremplit le champ alias du modal : le widget rend son
 * modal en shadow DOM ouvert, créé à l'ouverture — on observe
 * `document.body` et on remplit le champ dès qu'il apparaît.
 */
export function PispiCheckout({
  amount,
  motif,
  initialAlias = null,
  createOrders,
  linkOrdersToPayment,
  onClose,
}: PispiCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const createOrdersRef = useRef(createOrders);
  const linkOrdersRef = useRef(linkOrdersToPayment);
  const initialAliasRef = useRef(initialAlias);
  onCloseRef.current = onClose;
  createOrdersRef.current = createOrders;
  linkOrdersRef.current = linkOrdersToPayment;
  initialAliasRef.current = initialAlias;

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

        // 4. Créer le règlement escrow chez l'API SaaS : elle notifiera
        // kioskfy par webhook (PAIEMENT_RECU) pour marquer les commandes
        // payées sans dépendre du polling. Fire-and-forget : le checkout
        // ne doit pas être bloqué si cette étape échoue.
        void api.payments
          .createPispiReglement({ txId })
          .catch((error: unknown) => {
            console.warn(
              "[PI-SPI] Règlement SaaS non créé (fallback polling actif) :",
              error,
            );
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

    // Préremplit l'alias du client dès que le modal apparaît (le modal est
    // créé à l'ouverture, en shadow DOM ouvert attaché à document.body).
    const observer = new MutationObserver(() => {
      const alias = initialAliasRef.current;
      if (alias && isValidAlias(alias) && document.body.querySelector(MODAL_SELECTOR)) {
        prefillModalAlias(alias);
      }
    });
    observer.observe(document.body, { childList: true });

    return () => {
      observer.disconnect();
      checkout.unmount();
    };
  }, [amount, motif]);

  return <div ref={containerRef} className="w-full" />;
}
