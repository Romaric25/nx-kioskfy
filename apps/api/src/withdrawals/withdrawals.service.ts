import { Injectable, Inject, BadRequestException, NotFoundException } from "@nestjs/common";
import { DRIZZLE } from "../db";
import { withdrawals, organizationBalances } from "../db/app-schema";
import { eq } from "drizzle-orm";
import type { Database } from "../db";
import type { CreateWithdrawalDto } from "./dto/withdrawal.dto";
import { OrganizationsService } from "../organizations/organizations.service";

@Injectable()
export class WithdrawalsService {
  constructor(
    @Inject(DRIZZLE) private db: Database,
    private readonly organizations: OrganizationsService,
  ) {}

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
