import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { PaymentsService } from "../payments/payments.service";

export interface PaiementRecuWebhook {
  event?: string;
  commandeId?: string;
  txId?: string;
  end2endId?: string;
  payeurAlias?: string;
  payeurNom?: string;
  payeurPays?: string;
  [key: string]: unknown;
}

/**
 * Réception des webhooks sortants de l'API SaaS PI-SPI.
 *
 * L'API SaaS notifie cette API quand un paiement PI-SPI est reçu pour une
 * commande : on marque alors les orders liés au txId comme payés (parts de
 * revenus + soldes), de façon idempotente.
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly payments: PaymentsService,
  ) {}

  /**
   * Vérifie la signature HMAC-SHA256 du corps brut contre le secret partagé
   * `PISPI_WEBHOOK_SECRET`. Comparaison à temps constant.
   *
   * Tolère les signatures hex (minuscules/majuscules), base64 et le préfixe
   * `sha256=` (l'émetteur SaaS peut varier d'encodage selon sa version).
   */
  verifierSignature(corpsBrut: string | Buffer, signature?: string): boolean {
    const secret = this.config.get<string>("PISPI_WEBHOOK_SECRET");
    if (!secret || !signature) return false;

    const signatureNormee = signature.trim().replace(/^sha256=/i, "");
    if (!signatureNormee) return false;

    const cles: Buffer[] = [Buffer.from(secret, "utf8")];
    if (/^[0-9a-f]{64}$/i.test(secret)) cles.push(Buffer.from(secret, "hex"));
    const decodeBase64 = Buffer.from(secret, "base64");
    if (decodeBase64.length > 0) cles.push(decodeBase64);

    for (const cle of cles) {
      // Deux instances séparées : un second `digest()` sur le même objet
      // HMAC renvoie une chaîne vide (objet déjà finalisé).
      const hex = createHmac("sha256", cle).update(corpsBrut).digest("hex");
      const b64 = createHmac("sha256", cle).update(corpsBrut).digest("base64");
      for (const candidat of [hex, hex.toUpperCase(), b64]) {
        if (candidat.length !== signatureNormee.length) continue;
        try {
          if (
            timingSafeEqual(
              Buffer.from(candidat, "utf8"),
              Buffer.from(signatureNormee, "utf8"),
            )
          ) {
            return true;
          }
        } catch {
          // Longueurs égales vérifiées ci-dessus : ne devrait pas arriver.
        }
      }
    }
    return false;
  }

  /** Distribue l'événement reçu vers le bon handler métier. */
  async traiter(evenement: string, payload: PaiementRecuWebhook): Promise<void> {
    switch (evenement) {
      case "PAIEMENT_RECU":
        await this.traiterPaiementRecu(payload);
        return;
      default:
        this.logger.log(`Événement ${evenement} ignoré (pas de handler métier)`);
    }
  }

  /**
   * PAIEMENT_RECU : marque les commandes payées. Idempotent — un doublon
   * (webhook + polling de confirmation) ne crée pas de parts en double.
   * Les commandes inconnues sont loguées sans erreur : le webhook peut
   * arriver avant que le lien txId → orders soit visible, ou être rejoué.
   *
   * Note : le SaaS envoie `commandeId` (référence marketplace, = paymentId
   * kioskfy) et `txId` (son txId de transfert, préfixé REG-). On préfère
   * donc `commandeId`.
   */
  private async traiterPaiementRecu(payload: PaiementRecuWebhook): Promise<void> {
    const txId = payload.commandeId ?? payload.txId ?? "";
    if (!txId) {
      this.logger.warn(
        `PAIEMENT_RECU sans txId identifiable : ${JSON.stringify(payload).slice(0, 300)}`,
      );
      return;
    }
    try {
      const resultat = await this.payments.processSuccess(txId, {
        ...(typeof payload.payeurAlias === "string" && payload.payeurAlias
          ? { payeurAlias: payload.payeurAlias }
          : {}),
        ...(typeof payload.payeurNom === "string" && payload.payeurNom
          ? { payeurNom: payload.payeurNom }
          : {}),
        ...(typeof payload.payeurPays === "string" && payload.payeurPays
          ? { payeurPays: payload.payeurPays }
          : {}),
      });
      this.logger.log(
        `PAIEMENT_RECU appliqué : ${resultat.orderIds.length} commande(s) payée(s) pour ${txId}`,
      );
    } catch (error) {
      this.logger.warn(
        `PAIEMENT_RECU non appliqué pour ${txId} : ${(error as Error).message}`,
      );
    }
  }
}
