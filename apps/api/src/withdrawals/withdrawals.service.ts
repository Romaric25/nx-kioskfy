import {
  Injectable,
  Inject,
  BadRequestException,
  BadGatewayException,
  NotFoundException,
  Logger,
  type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DRIZZLE } from "../db";
import { withdrawals, organizationBalances } from "../db/app-schema";
import { organizations as orgsTable } from "../db/auth-schema";
import { eq } from "drizzle-orm";
import type { Database } from "../db";
import type { CreateWithdrawalDto, TraiterWithdrawalDto } from "./dto/withdrawal.dto";
import { OrganizationsService } from "../organizations/organizations.service";

/** Résultat de l'initiation d'un versement PI-SPI. */
interface ResultatVersement {
  statut: "completed" | "processing";
  externalReference: string | null;
  note: string;
}

/**
 * Intervalle de surveillance des transferts PI-SPI `INITIE` : on interroge
 * le statut de la plateforme jusqu'à IRREVOCABLE (ou REJETE).
 */
const SURVEILLANCE_MS = 60_000;

@Injectable()
export class WithdrawalsService implements OnModuleInit {
  private readonly logger = new Logger(WithdrawalsService.name);

  constructor(
    @Inject(DRIZZLE) private db: Database,
    private readonly organizations: OrganizationsService,
    private readonly config: ConfigService,
  ) {}

  /** Base URL de l'API SaaS PI-SPI (dev/prod comme PaymentsService). */
  private get pispiSaasApiUrl(): string {
    const isProd = this.config.get<string>("NODE_ENV") === "production";
    return (
      this.config.get<string>("PISPI_SAAS_API_URL") ||
      (isProd ? "https://spi.romaric.co/api" : "http://localhost:3015/api")
    );
  }

  /**
   * Surveille les versements `INITIE` (statut `processing` en base) :
   * dès que la plateforme PI-SPI répond IRREVOCABLE, la demande passe
   * `completed` ; un REJETE la fait passer `failed` et restaure le solde.
   */
  onModuleInit(): void {
    setInterval(() => void this.surveillerVersements(), SURVEILLANCE_MS);
  }

  private async surveillerVersements(): Promise<void> {
    const enCours = await this.db.query.withdrawals.findMany({
      where: eq(withdrawals.status, "processing"),
      limit: 50,
    });
    if (enCours.length === 0) return;

    // Journal des événements PI-SPI reçus par le SaaS : permet de
    // réconcilier les paiements SORTANTS (agence cliente : la plateforme
    // notifie le débit de notre compte sans qu'on l'initie par API).
    const evenements = await this.recupererEvenementsSaaS();

    for (const w of enCours) {
      // 1) Transfert interne initié par nous (INITIE → IRREVOCABLE).
      if (w.externalReference?.startsWith("WDR-")) {
        try {
          const res = await fetch(
            `${this.pispiSaasApiUrl}/pispi/transferts/${encodeURIComponent(w.externalReference)}`,
            { signal: AbortSignal.timeout(15_000) },
          );
          if (res.ok) {
            const transfert = (await res.json()) as {
              statut?: string;
              end2endId?: string;
            };
            const statut = String(transfert.statut ?? "").toUpperCase();
            if (statut === "IRREVOCABLE") {
              await this.marquerComplete(w.id, transfert.end2endId ?? w.externalReference);
              continue;
            }
            if (statut === "REJETE") {
              await this.marquerEchec(w, "Transfert PI-SPI rejeté");
              continue;
            }
          }
        } catch {
          // Transitoire : on réessaiera.
        }
      }

      // 2) Versement initié côté agence (demande de paiement du simulateur) :
      // la plateforme notifie le débit de notre compte dans le journal du
      // SaaS — on matche par l'alias de l'agence et le montant.
      const match = await this.trouverEvenementPaiement(w, evenements);
      if (match) {
        await this.marquerComplete(
          w.id,
          match.commandeId ?? w.externalReference ?? undefined,
        );
      }
    }
  }

  /** Journal des événements reçus par le SaaS (`GET /webhooks/evenements`). */
  private async recupererEvenementsSaaS(): Promise<
    Array<{ commandeId?: string | null; payload?: string | null; evenement: string }>
  > {
    try {
      const res = await fetch(`${this.pispiSaasApiUrl}/webhooks/evenements?limit=100`, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return [];
      return (await res.json()) as Array<{
        commandeId?: string | null;
        payload?: string | null;
        evenement: string;
      }>;
    } catch {
      return [];
    }
  }

  /** Alias PI-SPI de l'agence (lecture base, sans cache compliqué). */
  private async aliasAgence(organizationId: string): Promise<string | null> {
    const [org] = await this.db
      .select({ pispiAlias: orgsTable.pispiAlias })
      .from(orgsTable)
      .where(eq(orgsTable.id, organizationId));
    return org?.pispiAlias ?? null;
  }

  /**
   * Événement plateforme correspondant au versement : alias de l'agence ET
   * montant dans le payload, en excluant PAIEMENT_RECU (entrées clients).
   */
  private async trouverEvenementPaiement(
    w: { id: number; amount: string; organizationId: string },
    evenements: Array<{
      commandeId?: string | null;
      payload?: string | null;
      evenement: string;
    }>,
  ) {
    const alias = await this.aliasAgence(w.organizationId);
    if (!alias) return undefined;
    return evenements.find((e) => {
      if (e.evenement === "PAIEMENT_RECU") return false;
      const payload = e.payload ?? "";
      return (
        payload.includes(alias) &&
        payload.includes(`"montant":${Number(w.amount)}`)
      );
    });
  }

  private async marquerComplete(id: number, reference?: string): Promise<void> {
    await this.db
      .update(withdrawals)
      .set({
        status: "completed",
        ...(reference ? { externalReference: reference } : {}),
      })
      .where(eq(withdrawals.id, id));
    this.logger.log(`Retrait #${id} versé (confirmation plateforme)`);
  }

  private async marquerEchec(
    w: { id: number; organizationId: string; amount: string },
    raison: string,
  ): Promise<void> {
    await this.db
      .update(withdrawals)
      .set({ status: "failed", notes: raison })
      .where(eq(withdrawals.id, w.id));
    await this.organizations.annulerRetrait(w.organizationId, Number(w.amount));
    this.logger.warn(`Retrait #${w.id} en échec : ${raison}`);
  }

  /**
   * Crée une demande de retrait. Réservée au propriétaire (`owner`) de
   * l'agence : le montant est débité du solde disponible et la demande
   * part en `pending` pour traitement par l'équipe kioskfy.
   */
  async create(dto: CreateWithdrawalDto, userId: string) {
    await this.organizations.assertOwner(userId, dto.organizationId);

    const balance = await this.db.query.organizationBalances.findFirst({
      where: eq(organizationBalances.organizationId, dto.organizationId),
    });
    if (!balance || Number(balance.organizationAmount) < dto.amount) {
      throw new BadRequestException("Solde insuffisant");
    }

    const result = await this.db.insert(withdrawals).values({
      organizationId: dto.organizationId,
      amount: dto.amount.toFixed(2),
      currency: dto.currency || "XAF",
      status: "pending",
      paymentMethod: dto.paymentMethod || null,
      paymentDetails: dto.paymentDetails || null,
      notes: dto.notes || null,
      externalReference: dto.externalReference || null,
      userId,
    } as any);

    // Débit du solde : logique centralisée dans OrganizationsService.
    await this.organizations.recordWithdrawal(dto.organizationId, dto.amount);

    return this.db.query.withdrawals.findFirst({ where: eq(withdrawals.id, result[0].insertId) });
  }

  /**
   * Traitement d'une demande par l'administration :
   * - `completed` : exécute le versement PI-SPI réel vers l'alias de
   *   l'agence (transfert intra-comptes de la plateforme via le SaaS) ;
   *   IRREVOCABLE immédiat → `completed`, sinon `processing` (surveillé).
   * - `failed` / `cancelled` : solde de l'agence restauré.
   */
  async traiter(id: number, dto: TraiterWithdrawalDto) {
    const w = await this.getById(id);
    if (w.status !== "pending" && w.status !== "processing") {
      throw new BadRequestException(
        "Seules les demandes en attente ou en cours peuvent être traitées",
      );
    }

    if (dto.statut === "completed") {
      let resultat: ResultatVersement;
      try {
        resultat = await this.verserViaPispi(w);
      } catch (error) {
        // Initiation impossible : la demande passe en échec et le solde est
        // restauré (l'argent n'a pas quitté la plateforme).
        const message = (error as Error).message.slice(0, 255);
        await this.db
          .update(withdrawals)
          .set({ status: "failed", notes: message })
          .where(eq(withdrawals.id, id));
        await this.organizations.annulerRetrait(
          w.organizationId,
          Number(w.amount),
        );
        throw error;
      }

      await this.db
        .update(withdrawals)
        .set({
          status: resultat.statut,
          externalReference: resultat.externalReference,
          notes: dto.notes ?? resultat.note,
        })
        .where(eq(withdrawals.id, id));
      return this.getById(id);
    }

    await this.db
      .update(withdrawals)
      .set({
        status: dto.statut,
        ...(dto.externalReference !== undefined
          ? { externalReference: dto.externalReference }
          : {}),
        ...(dto.notes !== undefined || dto.reason !== undefined
          ? { notes: dto.reason ?? dto.notes ?? null }
          : {}),
      })
      .where(eq(withdrawals.id, id));

    // Échec ou annulation : restauration du solde débité à la demande.
    if (dto.statut === "failed" || dto.statut === "cancelled") {
      await this.organizations.annulerRetrait(w.organizationId, Number(w.amount));
    }

    return this.getById(id);
  }

  /**
   * Verse le montant à l'agence via la plateforme PI-SPI.
   *
   * Deux cas (selon la nature de l'alias de l'agence) :
   * - alias attaché à un de NOS comptes → transfert intra-comptes immédiat ;
   * - alias CLIENT du réseau (agence = cliente, catégorie P au RAC) → la
   *   plateforme n'autorise pas le push : la demande passe en `processing`
   *   avec la consigne d'initier la demande côté simulateur ; la
   *   réconciliation se fait automatiquement via le journal des événements.
   */
  private async verserViaPispi(w: {
    id: number;
    organizationId: string;
    amount: string;
  }): Promise<ResultatVersement> {
    const alias = await this.aliasAgence(w.organizationId);
    if (!alias) {
      throw new BadRequestException(
        "L'agence n'a pas d'alias PI-SPI enregistré (paramètres de l'agence) — impossible de verser",
      );
    }

    const reference = `WDR-${w.id}`;
    const res = await fetch(`${this.pispiSaasApiUrl}/pispi/versements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference,
        montant: Number(w.amount),
        motif: `Retrait kioskfy #${w.id}`,
        payeAlias: alias,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const texte = (await res.text()).slice(0, 300);
      // 4xx du SaaS/plateforme : alias CLIENT du réseau (impossible de
      // pousser un paiement vers un tiers) — on passe en attente du côté
      // agence plutôt que d'échouer.
      if (res.status >= 400 && res.status < 500) {
        return {
          statut: "processing",
          externalReference: null,
          note:
            `Agence cliente du réseau (alias tiers) : initiez dans le ` +
            `simulateur PI-SPI une demande de paiement de l'agence vers ` +
            `kioskfy (payeur 8350050d-6f94-481c-8caa-2b59b1a3664e, ` +
            `bénéficiaire ${alias}, motif « Retrait kioskfy #${w.id} »). ` +
            `Le statut passera automatiquement à « Payée » à la réception ` +
            `de la notification de la plateforme.`,
        };
      }
      throw new BadGatewayException(
        `Transfert PI-SPI refusé (${res.status}) : ${texte}`,
      );
    }

    const transfert = (await res.json()) as {
      statut?: string;
      end2endId?: string;
    };
    const statut = String(transfert.statut ?? "").toUpperCase();
    if (statut === "IRREVOCABLE") {
      return {
        statut: "completed",
        externalReference: transfert.end2endId ?? reference,
        note: "Versement PI-SPI effectué",
      };
    }
    if (statut === "INITIE") {
      return {
        statut: "processing",
        externalReference: reference,
        note: "Transfert PI-SPI initié (en cours de traitement)",
      };
    }
    throw new BadGatewayException(
      `Statut de transfert inattendu : ${statut || "—"}`,
    );
  }

  async getAll(limit = 50, offset = 0) {
    return this.db.query.withdrawals.findMany({
      with: { organization: true, user: true },
      orderBy: (w, { desc }) => [desc(w.createdAt)],
      limit, offset,
    });
  }

  /** Retraits d'une organisation — réservé au propriétaire de l'agence. */
  async getByOrganization(orgId: string, userId: string, limit = 50, offset = 0) {
    await this.organizations.assertOwner(userId, orgId);
    return this.db.query.withdrawals.findMany({
      where: eq(withdrawals.organizationId, orgId),
      orderBy: (w, { desc }) => [desc(w.createdAt)],
      limit, offset,
    });
  }

  async getById(id: number) {
    const w = await this.db.query.withdrawals.findFirst({ where: eq(withdrawals.id, id) });
    if (!w) throw new NotFoundException("Retrait non trouvé");
    return w;
  }

  /** Annule une demande en attente — réservé au propriétaire de l'agence. */
  async cancel(id: number, userId: string, reason?: string) {
    const w = await this.getById(id);
    await this.organizations.assertOwner(userId, w.organizationId);
    if (w.status !== "pending") throw new BadRequestException("Seuls les retraits en attente peuvent être annulés");

    await this.db.update(withdrawals).set({ status: "cancelled" as any, notes: reason || w.notes }).where(eq(withdrawals.id, id));

    // Restauration du solde : logique centralisée dans OrganizationsService.
    await this.organizations.annulerRetrait(w.organizationId, Number(w.amount));

    return this.getById(id);
  }
}
