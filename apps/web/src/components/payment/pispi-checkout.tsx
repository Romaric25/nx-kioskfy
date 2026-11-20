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
  /**
   * Masque le logo PI-SPI du bouton de paiement (le bouton garde son
   * texte « Payer avec PI-SPI »).
   */
  hideLogo?: boolean;
  /**
   * Texte du bouton de paiement (remplace le libellé par défaut du
   * widget, ex. « Payer avec PI-SPI »).
   */
  buttonLabel?: string;
}

const BUTTON_SELECTOR = 'span[data-pispi-checkout="button"]';
const MODAL_SELECTOR = 'div[data-pispi-checkout="modal"]';

/** Statuts de la plateforme qui signifient « paiement reçu ». */
const STATUTS_SUCCES = new Set(["IRREVOCABLE", "ACCEPTE", "ACCEPTEE"]);

/**
 * Masque le logo du bouton PI-SPI. Le widget ne propose pas d'option pour
 * ça : son bouton est rendu dans un shadow DOM ouvert, on cache donc
 * l'image directement (même approche que le préremplissage de l'alias).
 */
function hideButtonLogo(container: HTMLElement): void {
  const host = container.querySelector<HTMLElement>(BUTTON_SELECTOR);
  const logo = host?.shadowRoot?.querySelector<HTMLImageElement>(
    'img[alt="PI-SPI"]',
  );
  if (logo) {
    logo.style.display = "none";
  }
}

/**
 * Remplace le libellé du bouton PI-SPI (le widget ne permet pas de
 * personnaliser son texte) : le label est le premier `span` du bouton,
 * accessible via le shadow DOM ouvert.
 */
function setButtonLabel(container: HTMLElement, label: string): void {
  const host = container.querySelector<HTMLElement>(BUTTON_SELECTOR);
  const span = host?.shadowRoot?.querySelector<HTMLSpanElement>(
    "button span",
  );
  if (span) {
    span.textContent = label;
  }
}

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
  hideLogo = false,
  buttonLabel,
}: PispiCheckoutProps) {
  const hideLogoRef = useRef(hideLogo);
  hideLogoRef.current = hideLogo;
  const buttonLabelRef = useRef(buttonLabel);
  buttonLabelRef.current = buttonLabel;
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const createOrdersRef = useRef(createOrders);
  const linkOrdersRef = useRef(linkOrdersToPayment);
  const initialAliasRef = useRef(initialAlias);
  onCloseRef.current = onClose;
  createOrdersRef.current = createOrders;
  linkOrdersRef.current = linkOrdersToPayment;
  initialAliasRef.current = initialAlias;

  // txId de la demande en cours + verrou anti double-fermeture.
  const txIdRef = useRef<string | null>(null);
  const autoClosedRef = useRef(false);

  /**
   * Fermeture automatique du modal dès que le paiement est reçu : le SDK
   * poll lui-même le statut mais ne ferme pas le modal tout seul (il
   * affiche l'écran de succès et attend l'utilisateur). On surveille donc
   * en parallèle et, dès IRREVOCABLE, on ferme le modal et on notifie le
   * parent — qui vide le panier et redirige vers la page de succès.
   */
  useEffect(() => {
    const fermerAuto = (txId: string) => {
      if (autoClosedRef.current) return;
      autoClosedRef.current = true;
      document.body
        .querySelectorAll(MODAL_SELECTOR)
        .forEach((el) => el.remove());
      document.documentElement.style.overflow = "";
      onCloseRef.current({
        success: true,
        status: "success",
        txId,
        invoiceUrl: undefined,
      });
    };

    const surveiller = () => {
      const txId = txIdRef.current;
      if (!txId || autoClosedRef.current) return;
      void getPispiPaymentStatus(txId)
        .then((res) => {
          const statut = String(res?.statut ?? "").toUpperCase();
          if (STATUTS_SUCCES.has(statut)) fermerAuto(txId);
        })
        .catch(() => undefined); // transitoire : on réessaiera au tick suivant
    };

    const timer = setInterval(surveiller, 2_000);
    return () => {
      clearInterval(timer);
      // Si le composant se démonte, on libère aussi le modal du widget.
      document.body
        .querySelectorAll(MODAL_SELECTOR)
        .forEach((el) => el.remove());
      document.documentElement.style.overflow = "";
    };
  }, []);

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
        txIdRef.current = txId;
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

    // Masque le logo PI-SPI du bouton si demandé (shadow DOM ouvert).
    if (hideLogoRef.current && containerRef.current) {
      hideButtonLogo(containerRef.current);
    }

    // Personnalise le libellé du bouton si demandé.
    if (buttonLabelRef.current && containerRef.current) {
      setButtonLabel(containerRef.current, buttonLabelRef.current);
    }

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
