/**
 * Client PI-SPI (librairie @pi-spi/checkout + API SaaS PI-SPI).
 *
 * Chaque application (kioskfy, admin, organisation…) a son propre compte
 * PI-SPI (VITE_PISPI_ACCOUNT_NUMBER). L'API SaaS résout l'alias
 * bénéficiaire à partir de ce numéro de compte. Les endpoints de l'API
 * SaaS sont publics (démo) — en production, protéger derrière un backend.
 */

import { API_ORIGIN } from "@/lib/api";

const isProd = import.meta.env?.PROD;

/** Base URL de l'API SaaS PI-SPI (dev : http://localhost:3015/api). */
export const PISPI_API_URL =
  import.meta.env?.VITE_PISPI_API_URL ||
  (isProd ? "https://spi.romaric.co/api" : "http://localhost:3015/api");

/**
 * Numéro du compte PI-SPI qui reçoit les paiements de cette application.
 * kioskfy : 76713101997799565192 (compte TRAN OUVERT chez le participant).
 */
export const PISPI_ACCOUNT_NUMBER =
  import.meta.env?.VITE_PISPI_ACCOUNT_NUMBER || "76713101997799565192";

/**
 * Alias explicite du compte payé (optionnel). Si absent, l'API SaaS résout
 * automatiquement le premier alias du compte PISPI_ACCOUNT_NUMBER.
 */
export const PISPI_BUSINESS_ALIAS: string | undefined =
  import.meta.env?.VITE_PISPI_BUSINESS_ALIAS || undefined;

/**
 * Alias PI-SPI de la marketplace (compte qui reçoit les paiements) —
 * configuré dans les paramètres du site (admin kioskfy, groupe
 * « Paiements & commissions », clé `marketplace_pispi_alias`). L'env
 * `VITE_PISPI_BUSINESS_ALIAS` reste prioritaire (override de déploiement).
 * Mis en cache après le premier chargement.
 */
let _marketplaceAliasPromise: Promise<string | null> | null = null;
let _marketplaceAlias: string | null = null;

async function getMarketplacePispiAlias(): Promise<string | null> {
  if (_marketplaceAlias) return _marketplaceAlias;
  if (!_marketplaceAliasPromise) {
    _marketplaceAliasPromise = (async () => {
      try {
        const res = await fetch(`${API_ORIGIN}/api/settings`, {
          credentials: "include",
        });
        if (!res.ok) return null;
        const data = (await res.json()) as Record<
          string,
          { key?: string; value?: unknown }
        >;
        const brut = data["marketplace_pispi_alias"]?.value;
        return typeof brut === "string" && brut.trim() !== ""
          ? brut.trim()
          : null;
      } catch {
        return null;
      }
    })();
  }
  const alias = await _marketplaceAliasPromise;
  _marketplaceAlias = alias;
  return alias;
}

export interface PispiDemandeResponse {
  txId: string;
  statut?: string;
  payeurNom?: string;
  payeurPays?: string;
  [key: string]: unknown;
}

interface PispiErrorBody {
  detail?: string;
  message?: string | string[];
  error?: string;
  title?: string;
  statusCode?: number;
  status?: number;
  "invalid-params"?: unknown[];
  [key: string]: unknown;
}

/**
 * Extrait un message lisible d'une erreur de l'API SaaS/PI-SPI et affiche
 * le détail complet (statut, corps de réponse, payload) dans la console.
 */
function describePispiError(
  context: string,
  res: Response,
  body: PispiErrorBody,
  extra?: unknown,
): string {
  const message =
    typeof body?.detail === "string" && body.detail
      ? body.detail
      : Array.isArray(body?.message)
        ? body.message.join(", ")
        : typeof body?.message === "string" && body.message
          ? body.message
          : undefined;

  console.error(
    `[PI-SPI] ${context} — HTTP ${res.status} ${res.statusText}`,
    {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      message,
      responseBody: body,
      ...(extra !== undefined ? { extra } : {}),
    },
  );

  return (
    message || body?.title || body?.error || `Erreur HTTP ${res.status} (${context})`
  );
}

/** Crée une demande de paiement RTP auprès de l'API SaaS PI-SPI. */
export async function createPispiPaymentRequest(payload: {
  txId: string;
  payeurAlias: string;
  montant: number;
  motif?: string;
}): Promise<PispiDemandeResponse> {
  // Bénéficiaire (payeAlias) : env explicite > alias configuré dans les
  // paramètres du site > résolution automatique par l'API SaaS (compte).
  const payeAlias =
    PISPI_BUSINESS_ALIAS ?? (await getMarketplacePispiAlias());

  const requestBody = {
    txId: payload.txId,
    confirmation: false,
    categorie: "500",
    payeurAlias: payload.payeurAlias,
    accountNumber: PISPI_ACCOUNT_NUMBER,
    ...(payeAlias ? { payeAlias } : {}),
    montant: payload.montant,
    ...(payload.motif && payload.motif.length >= 2
      ? { motif: payload.motif }
      : {}),
  };

  const res = await fetch(`${PISPI_API_URL}/pispi/demandes-paiements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as PispiErrorBody;
    const message = describePispiError(
      "Création de la demande de paiement",
      res,
      body,
      requestBody,
    );
    throw new Error(message || "Demande de paiement non envoyée");
  }

  return res.json();
}

/** Récupère le statut d'une demande de paiement RTP (polling du widget). */
export async function getPispiPaymentStatus(
  txId: string,
): Promise<{ statut: string }> {
  const res = await fetch(
    `${PISPI_API_URL}/pispi/demandes-paiements/${encodeURIComponent(txId)}`,
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as PispiErrorBody;
    const message = describePispiError("Statut de la demande", res, body, {
      txId,
    });
    throw new Error(message || "Statut de paiement indisponible");
  }
  const data = (await res.json()) as { statut?: string };
  return { statut: String(data?.statut ?? "INITIE") };
}
