import { Injectable, Inject, NotFoundException, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DRIZZLE } from "../db";
import { orders, revenueShares, organizationBalances, siteSettings } from "../db/app-schema";
import { eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../db";

/** Informations du payeur PI-SPI (webhook ou interrogation du SaaS). */
export interface InfosPayeur {
  payeurAlias?: string;
  payeurNom?: string;
  payeurPays?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(DRIZZLE) private db: Database,
  ) {}

  private get host() { return this.config.getOrThrow<string>("MONEROO_HOST"); }
  private get secretKey() { return this.config.getOrThrow<string>("MONEROO_SECRET_KEY"); }

  /**
   * Base URL de l'API SaaS PI-SPI (dev : http://localhost:3015/api,
   * prod : https://spi.romaric.co/api via PISPI_SAAS_API_URL).
   */
  private get pispiSaasApiUrl() {
    const isProd = this.config.get<string>("NODE_ENV") === "production";
    return (
      this.config.get<string>("PISPI_SAAS_API_URL") ||
      (isProd ? "https://spi.romaric.co/api" : "http://localhost:3015/api")
    );
  }

  async initializePayment(body: any) {
    const res = await fetch(`${this.host}/payments/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.secretKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Moneroo API Error: ${await res.text()}`);
    return res.json();
  }

  async verifyPayment(paymentId: string) {
    const res = await fetch(`${this.host}/payments/${paymentId}/verify`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    if (!res.ok) throw new Error(`Moneroo API Error: ${await res.text()}`);
    return res.json();
  }

  /**
   * Marque payées les commandes liées à un paiement et crée les parts de
   * revenus + soldes. IDEMPOTENT : seules les commandes non terminées sont
   * traitées — un webhook rejoué (ou doublon avec le polling) ne crée pas
   * de parts en double. Enregistre aussi les informations du payeur PI-SPI
   * (alias, nom, pays) sur les commandes.
   */
  async processSuccess(paymentId: string, payeur?: InfosPayeur) {
    const found = await this.db.query.orders.findMany({
      where: eq(orders.paymentId, paymentId),
      with: { newspaper: { with: { organization: true, country: true } } },
    });

    if (!found.length) throw new NotFoundException(`No orders for payment ${paymentId}`);

    const aTraiter = found.filter((order) => order.status !== "completed");
    const { platformPercentage, organizationPercentage } =
      await this.pourcentagesRepartition();

    await this.db.update(orders).set({
      status: "completed",
      updatedAt: new Date(),
      ...(payeur?.payeurAlias ? { payeurAlias: payeur.payeurAlias } : {}),
      ...(payeur?.payeurNom ? { payeurNom: payeur.payeurNom } : {}),
      ...(payeur?.payeurPays ? { payeurPays: payeur.payeurPays } : {}),
    }).where(eq(orders.paymentId, paymentId));

    await Promise.all(aTraiter.map(async (order) => {
      const orgId = order.newspaper?.organizationId;
      if (!orgId) return;

      const total = parseFloat(order.price);
      const platformAmount = (total * platformPercentage) / 100;
      const orgAmount = (total * organizationPercentage) / 100;
      const currency = order.newspaper?.country?.currency || "XAF";

      await this.db.insert(revenueShares).values({
        orderId: order.id,
        organizationId: orgId,
        totalAmount: total.toFixed(2),
        platformAmount: platformAmount.toFixed(2),
        organizationAmount: orgAmount.toFixed(2),
        platformPercentage: platformPercentage.toFixed(2),
        organizationPercentage: organizationPercentage.toFixed(2),
        currency,
        status: "processed",
        processedAt: new Date(),
      });

      const result = await this.db.update(organizationBalances).set({
        organizationAmount: sql`${organizationBalances.organizationAmount} + ${orgAmount.toFixed(2)}`,
        platformAmount: sql`${organizationBalances.platformAmount} + ${platformAmount.toFixed(2)}`,
        totalSales: sql`${organizationBalances.totalSales} + 1`,
      }).where(eq(organizationBalances.organizationId, orgId));

      if (result[0].affectedRows === 0) {
        await this.db.insert(organizationBalances).values({
          organizationId: orgId,
          organizationAmount: orgAmount.toFixed(2),
          platformAmount: platformAmount.toFixed(2),
          totalSales: 1,
          totalWithdrawals: 0,
          withdrawnAmount: "0.00",
          currency,
        });
      }
    }));

    return {
      orderIds: aTraiter.map((o) => o.id),
      dejaPayees: found.length - aTraiter.length,
    };
  }

  /**
   * Crée le règlement escrow chez l'API SaaS PI-SPI pour le txId donné.
   *
   * Conditions : toutes les commandes du txId appartiennent à la même agence
   * et celle-ci a un `pispiAlias` (compte PI-SPI BCEAO du vendeur). Sinon on
   * saute la création (le flux de polling reste le filet de sécurité).
   * Idempotent : un 409 (commandeId déjà enregistré) est traité comme OK.
   */
  async creerReglementSaaS(txId: string) {
    const found = await this.db.query.orders.findMany({
      where: eq(orders.paymentId, txId),
      with: { newspaper: { with: { organization: true, country: true } } },
    });

    if (!found.length) {
      throw new NotFoundException(`Aucune commande liée au txId ${txId}`);
    }

    const alias = found[0].newspaper?.organization?.pispiAlias;
    if (!alias) {
      this.logger.warn(
        `Règlement SaaS ignoré pour ${txId} : l'agence n'a pas de pispiAlias`,
      );
      return { cree: false, raison: "pispiAlias manquant" };
    }

    const memeAgence = found.every(
      (order) => order.newspaper?.organizationId === found[0].newspaper?.organizationId,
    );
    if (!memeAgence) {
      this.logger.warn(
        `Règlement SaaS ignoré pour ${txId} : panier multi-agences`,
      );
      return { cree: false, raison: "panier multi-agences" };
    }

    const total = found.reduce((sum, order) => sum + parseFloat(order.price), 0);
    const montant = Math.round(total);
    const { platformPercentage } = await this.pourcentagesRepartition();
    const commission = Math.round((total * platformPercentage) / 100);

    const callbackUrl = this.callbackUrl;
    const callbackSecret = this.config.get<string>("PISPI_WEBHOOK_SECRET") || undefined;
    const siteIdentifier =
      (await this.siteIdentifier()) || this.config.get<string>("SITE_IDENTIFIER") || undefined;

    const res = await fetch(`${this.pispiSaasApiUrl}/reglements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commandeId: txId,
        montant,
        commission,
        vendeurCompte: alias,
        ...(siteIdentifier ? { siteIdentifier } : {}),
        ...(callbackUrl ? { callbackUrl } : {}),
        ...(callbackSecret ? { callbackSecret } : {}),
      }),
    });

    if (res.status === 409) {
      // commandeId unique : le règlement existe déjà (idempotence).
      return { cree: false, dejaExistant: true };
    }
    if (!res.ok) {
      this.logger.error(
        `Échec de création du règlement SaaS pour ${txId} (HTTP ${res.status}) : ${await res.text()}`,
      );
      return { cree: false, raison: `HTTP ${res.status}` };
    }
    this.logger.log(`Règlement SaaS créé pour ${txId} (net vendeur ${montant - commission} FCFA)`);
    return { cree: true, reglement: await res.json() };
  }

  /**
   * Répartition des revenus configurée dans les paramètres du site
   * (admin kioskfy, groupe « Paiements & commissions ») :
   * - `commission_rate` → part plateforme
   * - `organization_percentage` → part organisation
   *
   * Les valeurs par défaut (25 % / 75 %) sont insérées par le seed du
   * SettingsModule au démarrage — la source unique de vérité est la table
   * `site_settings`. Si une clé venait à manquer, on échoue explicitement
   * (503) plutôt que de répartir avec des pourcentages fantaisistes.
   */
  private async pourcentagesRepartition(): Promise<{
    platformPercentage: number;
    organizationPercentage: number;
  }> {
    const lignes = await this.db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(
        inArray(siteSettings.key, ["commission_rate", "organization_percentage"]),
      );

    const parCle = new Map(lignes.map((l) => [l.key, l.value]));

    const lire = (cle: string): number => {
      const brut = parCle.get(cle);
      const valeur =
        brut === null || brut === undefined || brut.trim() === ""
          ? Number.NaN
          : Number(brut);
      if (!Number.isFinite(valeur)) {
        this.logger.error(
          `Paramètre du site "${cle}" manquant ou invalide — vérifiez ` +
            `l'onglet « Paiements & commissions » de l'admin`,
        );
        throw new ServiceUnavailableException(
          `Paramètre de répartition "${cle}" manquant`,
        );
      }
      return valeur;
    };

    return {
      platformPercentage: lire("commission_rate"),
      organizationPercentage: lire("organization_percentage"),
    };
  }

  /** Identifiant du site configuré dans les paramètres (admin kioskfy). */
  private async siteIdentifier(): Promise<string | null> {
    const [setting] = await this.db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, "site_identifier"));
    return setting?.value && setting.value.trim() !== ""
      ? setting.value.trim()
      : null;
  }

  /** URL publique de réception des webhooks PI-SPI sur cette API. */
  private get callbackUrl(): string {
    return (
      this.config.get<string>("PISPI_WEBHOOK_URL") ||
      (this.config.get<string>("NODE_ENV") === "production"
        ? "https://api.kioskfy.com/api/webhooks/pispi"
        : "http://localhost:3000/api/webhooks/pispi")
    );
  }

  /**
   * Confirmation côté serveur d'un paiement PI-SPI : interroge l'API SaaS
   * (statut de la demande RTP) et, si le paiement est irrévocable, marque
   * les commandes associées au `txId` comme payées.
   */
  async confirmPispiPayment(txId: string) {
    const res = await fetch(
      `${this.pispiSaasApiUrl}/pispi/demandes-paiements/${encodeURIComponent(txId)}`,
    );
    if (!res.ok) {
      throw new NotFoundException(`Transaction PI-SPI introuvable (${txId})`);
    }

    const demande = (await res.json()) as { statut?: string };
    const statut = String(demande?.statut ?? "").toUpperCase();
    const isSuccess = ["IRREVOCABLE", "ACCEPTE", "ACCEPTEE"].includes(statut);

    if (!isSuccess) {
      return { success: false, statut };
    }

    // Récupère les informations du payeur depuis le paiement reçu
    // (alias, nom, pays) pour les enregistrer sur les commandes.
    const paiement = await this.getPaiementRecu(txId);

    const { orderIds } = await this.processSuccess(txId, {
      ...(paiement?.payeurAlias ? { payeurAlias: String(paiement.payeurAlias) } : {}),
      ...(paiement?.payeurNom ? { payeurNom: String(paiement.payeurNom) } : {}),
      ...(paiement?.payeurPays ? { payeurPays: String(paiement.payeurPays) } : {}),
    });
    return { success: true, statut, orderIds };
  }

  /** Paiement reçu chez le SaaS (`GET /pispi/paiements/{txId}`), best effort. */
  private async getPaiementRecu(txId: string): Promise<{
    payeurAlias?: string;
    payeurNom?: string;
    payeurPays?: string;
  } | null> {
    try {
      const res = await fetch(
        `${this.pispiSaasApiUrl}/pispi/paiements/${encodeURIComponent(txId)}`,
      );
      if (!res.ok) return null;
      return (await res.json()) as {
        payeurAlias?: string;
        payeurNom?: string;
        payeurPays?: string;
      };
    } catch (error) {
      this.logger.warn(
        `Impossible de récupérer le payeur pour ${txId} : ${(error as Error).message}`,
      );
      return null;
    }
  }
}
