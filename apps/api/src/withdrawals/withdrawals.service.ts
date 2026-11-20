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
import { eq, count, inArray } from "drizzle-orm";
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
   * Surveille les versements en cours (statut `processing` en base) : le
   * statut du paiement PI-SPI est interrogé via le SaaS jusqu'à
   * IRREVOCABLE (→ `completed`) ou REJETE (→ `failed` + solde restauré).
   */
  onModuleInit(): void {
    setInterval(() => void this.surveillerVersements(), SURVEILLANCE_MS);
  }

  private async surveillerVersements(): Promise<void> {
    const enCours = await this.db.query.withdrawals.findMany({
      where: eq(withdrawals.status, "processing"),
      limit: 50,
    });
    for (const w of enCours) {
      if (!w.externalReference) continue;
      try {
        const res = await fetch(
          `${this.pispiSaasApiUrl}/pispi/versements/${encodeURIComponent(w.externalReference)}`,
          { signal: AbortSignal.timeout(15_000) },
        );
        if (!res.ok) continue; // paiement pas encore visible côté plateforme
        const paiement = (await res.json()) as {
          statut?: string;
          end2endId?: string;
        };
        const statut = String(paiement.statut ?? "").toUpperCase();
        if (statut === "IRREVOCABLE") {
          await this.marquerComplete(w.id, paiement.end2endId ?? w.externalReference);
        } else if (statut === "REJETE") {
          await this.marquerEchec(w, "Paiement PI-SPI rejeté");
        }
      } catch (error) {
        // Erreur transitoire : on réessaiera au prochain passage.
        this.logger.debug(
          `Surveillance du retrait #${w.id} impossible : ${(error as Error).message}`,
        );
      }
    }
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

  /** Identifiants de versement de l'agence : alias, IBAN et participant. */
  private async infosVersementAgence(organizationId: string): Promise<{
    pispiAlias: string | null;
    pispiIban: string | null;
    pispiParticipant: string | null;
  }> {
    const [org] = await this.db
      .select({
        pispiAlias: orgsTable.pispiAlias,
        pispiIban: orgsTable.pispiIban,
        pispiParticipant: orgsTable.pispiParticipant,
      })
      .from(orgsTable)
      .where(eq(orgsTable.id, organizationId));
    return {
      pispiAlias: org?.pispiAlias ?? null,
      pispiIban: org?.pispiIban ?? null,
      pispiParticipant: org?.pispiParticipant ?? null,
    };
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
   * Verse le montant à l'agence via envoi de paiement PI-SPI (guide
   * officiel « Envoyer un paiement ») : le SaaS envoie le paiement vers
   * l'alias RAC de l'agence. IRREVOCABLE immédiat → `completed`, sinon
   * `processing` (surveillé par l'intervalle du module).
   */
  private async verserViaPispi(w: {
    id: number;
    organizationId: string;
    amount: string;
  }): Promise<ResultatVersement> {
    const reference = `WDR-${w.id}`;
    const infos = await this.infosVersementAgence(w.organizationId);
    // Parcours bénéficiaire (guide « Envoyer un paiement ») : alias RAC
    // en priorité, sinon IBAN + participant destinataire.
    const corps: Record<string, unknown> = {
      reference,
      montant: Number(w.amount),
      motif: `Retrait kioskfy #${w.id}`,
    };
    if (infos.pispiAlias) {
      corps.payeAlias = infos.pispiAlias;
    } else if (infos.pispiIban && infos.pispiParticipant) {
      corps.payeIban = infos.pispiIban;
      corps.payeParticipant = infos.pispiParticipant;
    } else if (infos.pispiIban) {
      throw new BadRequestException(
        "IBAN de l'agence sans participant destinataire : renseignez le code " +
          "du participant (banque) dans les paramètres de l'agence",
      );
    } else {
      throw new BadRequestException(
        "L'agence n'a ni alias PI-SPI ni IBAN enregistré (paramètres de " +
          "l'agence) — impossible de verser",
      );
    }

    const res = await fetch(`${this.pispiSaasApiUrl}/pispi/versements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const texte = (await res.text()).slice(0, 300);
      if (res.status >= 400 && res.status < 500) {
        throw new BadRequestException(
          texte.replace(/^.*"message":"([^"]+)".*$/s, '$1') ||
            `Envoi du paiement refusé (${res.status})`,
        );
      }
      throw new BadGatewayException(
        `Envoi du paiement PI-SPI refusé (${res.status}) : ${texte}`,
      );
    }

    const paiement = (await res.json()) as {
      statut?: string;
      end2endId?: string;
    };
    const statut = String(paiement.statut ?? "").toUpperCase();
    if (statut === "IRREVOCABLE") {
      return {
        statut: "completed",
        externalReference: paiement.end2endId ?? reference,
        note: "Versement PI-SPI effectué",
      };
    }
    if (statut === "ENVOYE") {
      return {
        statut: "processing",
        externalReference: paiement.end2endId ?? reference,
        note: "Paiement PI-SPI envoyé (en cours de traitement)",
      };
    }
    throw new BadGatewayException(
      `Statut de paiement inattendu : ${statut || "—"}`,
    );
  }

  async getAll(limit = 50, offset = 0) {
    return this.db.query.withdrawals.findMany({
      with: { organization: true, user: true },
      orderBy: (w, { desc }) => [desc(w.createdAt)],
      limit, offset,
    });
  }

  /**
   * Nombre de demandes de retrait à traiter par l'admin (badge de la
   * sidebar) : statuts `pending` et `processing`.
   */
  async countPending() {
    const rows = await this.db
      .select({ count: count() })
      .from(withdrawals)
      .where(inArray(withdrawals.status, ["pending", "processing"]));
    return { count: rows[0]?.count ?? 0 };
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
