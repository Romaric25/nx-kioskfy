/**
 * Client PI-SPI (librairie @pi-spi/checkout + API SaaS PI-SPI).
 *
 * Le compte business du SaaS reçoit les paiements via l'alias configuré
 * (VITE_PISPI_BUSINESS_ALIAS). Les endpoints de l'API SaaS sont publics
 * (démo) — en production, protéger derrière un backend.
 */

const isProd = import.meta.env?.PROD;

/** Base URL de l'API SaaS PI-SPI (ex: http://localhost:3000/api). */
export const PISPI_API_URL =
  import.meta.env?.VITE_PISPI_API_URL ||
  (isProd ? "https://api.pispi.kioskfy.com/api" : "http://localhost:3000/api");

/** Alias du compte business du SaaS qui reçoit les paiements. */
export const PISPI_BUSINESS_ALIAS =
  import.meta.env?.VITE_PISPI_BUSINESS_ALIAS ||
  "17ef2121-f638-4191-95ea-7167990acdc6";

export interface PispiDemandeResponse {
  txId: string;
  statut?: string;
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
  const requestBody = {
    txId: payload.txId,
    confirmation: false,
    categorie: "500",
    payeurAlias: payload.payeurAlias,
    payeAlias: PISPI_BUSINESS_ALIAS,
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
