import { Injectable, Inject, BadRequestException, NotFoundException } from "@nestjs/common";
import { DRIZZLE } from "../db";
import { withdrawals, organizationBalances } from "../db/app-schema";
import { eq, sql } from "drizzle-orm";
import type { Database } from "../db";
import type { CreateWithdrawalDto } from "./dto/withdrawal.dto";

@Injectable()
export class WithdrawalsService {
  constructor(@Inject(DRIZZLE) private db: Database) {}

  async create(dto: CreateWithdrawalDto) {
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
      status: (dto.status || "pending") as any,
      paymentMethod: dto.paymentMethod || null,
      paymentDetails: dto.paymentDetails || null,
      notes: dto.notes || null,
      externalReference: dto.externalReference || null,
      userId: dto.userId || null,
    } as any);

    await this.db.update(organizationBalances).set({
      organizationAmount: sql`${organizationBalances.organizationAmount} - ${dto.amount.toFixed(2)}`,
      withdrawnAmount: sql`${organizationBalances.withdrawnAmount} + ${dto.amount.toFixed(2)}`,
      totalWithdrawals: sql`${organizationBalances.totalWithdrawals} + 1`,
    }).where(eq(organizationBalances.organizationId, dto.organizationId));

    return this.db.query.withdrawals.findFirst({ where: eq(withdrawals.id, result[0].insertId) });
  }

  async getAll(limit = 50, offset = 0) {
    return this.db.query.withdrawals.findMany({
      with: { organization: true, user: true },
      orderBy: (w, { desc }) => [desc(w.createdAt)],
      limit, offset,
    });
  }

  async getByOrganization(orgId: string, limit = 50, offset = 0) {
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

  async cancel(id: number, reason?: string) {
    const w = await this.getById(id);
    if (w.status !== "pending") throw new BadRequestException("Seuls les retraits en attente peuvent être annulés");

    await this.db.update(withdrawals).set({ status: "cancelled" as any, notes: reason || w.notes }).where(eq(withdrawals.id, id));

    // Restaurer le solde
    await this.db.update(organizationBalances).set({
      organizationAmount: sql`${organizationBalances.organizationAmount} + ${w.amount}`,
      withdrawnAmount: sql`${organizationBalances.withdrawnAmount} - ${w.amount}`,
      totalWithdrawals: sql`${organizationBalances.totalWithdrawals} - 1`,
    }).where(eq(organizationBalances.organizationId, w.organizationId));

    return this.getById(id);
  }
}
