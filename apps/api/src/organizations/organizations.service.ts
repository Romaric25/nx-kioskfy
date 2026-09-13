import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { DRIZZLE } from "../db";
import { organizationBalances, revenueShares } from "../db/app-schema";
import { members, organizations } from "../db/auth-schema";
import { eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../db";
import type { OrganizationItem } from "@kioskfy/types";

export interface OrganizationBalanceResponse {
  id: number;
  organizationId: string;
  organizationAmount: number;
  platformAmount: number;
  totalSales: number;
  totalWithdrawals: number;
  withdrawnAmount: number;
  currency: string;
}

@Injectable()
export class OrganizationsService {
  constructor(@Inject(DRIZZLE) private db: Database) {}

  // ── Listing ────────────────────────────────────────────────────────────

  async findAll(): Promise<OrganizationItem[]> {
    const rows = await this.db.query.organizations.findMany({
      orderBy: (orgs, { desc }) => [desc(orgs.createdAt)],
    });

    return rows.map((org) => this.mapOrganization(org));
  }

  /** Find a single organization by its slug (public). */
  async findBySlug(slug: string): Promise<OrganizationItem | null> {
    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    });

    return org ? this.mapOrganization(org) : null;
  }

  /**
   * The organizations (press agencies) the current user belongs to,
   * via their Better Auth membership.
   */
  async getMyOrganizations(userId: string): Promise<OrganizationItem[]> {
    const memberships = await this.db.query.members.findMany({
      where: eq(members.userId, userId),
    });
    const ids = memberships.map((m) => m.organizationId);
    if (ids.length === 0) return [];

    const rows = await this.db.query.organizations.findMany({
      where: inArray(organizations.id, ids),
      orderBy: (orgs, { desc }) => [desc(orgs.createdAt)],
    });

    return rows.map((org) => this.mapOrganization(org));
  }

  private mapOrganization(org: typeof organizations.$inferSelect): OrganizationItem {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      email: org.email,
      phone: org.phone,
      country: org.country,
      address: org.address,
      description: org.description,
      price: org.price,
      suspended: org.suspended ?? false,
      metadata: org.metadata,
    };
  }

  // ── Balances ──────────────────────────────────────────────────────────

  async getOrCreateBalance(organizationId: string): Promise<OrganizationBalanceResponse> {
    let balance = await this.db.query.organizationBalances.findFirst({
      where: eq(organizationBalances.organizationId, organizationId),
    });

    if (!balance) {
      await this.db.insert(organizationBalances).values({
        organizationId,
        organizationAmount: "0.00",
        platformAmount: "0.00",
        totalSales: 0,
        totalWithdrawals: 0,
        withdrawnAmount: "0.00",
        currency: "XAF",
      });

      balance = await this.db.query.organizationBalances.findFirst({
        where: eq(organizationBalances.organizationId, organizationId),
      });
    }

    if (!balance) throw new NotFoundException("Impossible de créer le solde");

    return this.formatBalance(balance);
  }

  async getBalances(organizationId: string): Promise<OrganizationBalanceResponse | null> {
    const balance = await this.db.query.organizationBalances.findFirst({
      where: eq(organizationBalances.organizationId, organizationId),
    });
    return balance ? this.formatBalance(balance) : null;
  }

  async recordPurchase(
    organizationId: string,
    organizationAmount: number,
    platformAmount: number,
    currency = "XAF",
  ): Promise<void> {
    const result = await this.db
      .update(organizationBalances)
      .set({
        organizationAmount: sql`${organizationBalances.organizationAmount} + ${organizationAmount.toFixed(2)}`,
        platformAmount: sql`${organizationBalances.platformAmount} + ${platformAmount.toFixed(2)}`,
        totalSales: sql`${organizationBalances.totalSales} + 1`,
      })
      .where(eq(organizationBalances.organizationId, organizationId));

    if (result[0].affectedRows === 0) {
      await this.db.insert(organizationBalances).values({
        organizationId,
        organizationAmount: organizationAmount.toFixed(2),
        platformAmount: platformAmount.toFixed(2),
        totalSales: 1,
        totalWithdrawals: 0,
        withdrawnAmount: "0.00",
        currency,
      });
    }
  }

  async recordWithdrawal(organizationId: string, amount: number): Promise<void> {
    await this.db
      .update(organizationBalances)
      .set({
        organizationAmount: sql`${organizationBalances.organizationAmount} - ${amount.toFixed(2)}`,
        withdrawnAmount: sql`${organizationBalances.withdrawnAmount} + ${amount.toFixed(2)}`,
        totalWithdrawals: sql`${organizationBalances.totalWithdrawals} + 1`,
      })
      .where(eq(organizationBalances.organizationId, organizationId));
  }

  async recordRefund(
    organizationId: string,
    organizationAmount: number,
    platformAmount: number,
  ): Promise<void> {
    await this.db
      .update(organizationBalances)
      .set({
        organizationAmount: sql`${organizationBalances.organizationAmount} - ${organizationAmount.toFixed(2)}`,
        platformAmount: sql`${organizationBalances.platformAmount} - ${platformAmount.toFixed(2)}`,
        totalSales: sql`${organizationBalances.totalSales} - 1`,
      })
      .where(eq(organizationBalances.organizationId, organizationId));
  }

  async syncFromRevenueShares(organizationId: string): Promise<void> {
    const existing = await this.db.query.organizationBalances.findFirst({
      where: eq(organizationBalances.organizationId, organizationId),
    });

    if (existing && Number(existing.organizationAmount) > 0) return;

    const shares = await this.db.query.revenueShares.findMany({
      where: eq(revenueShares.organizationId, organizationId),
    });

    let totalOrg = 0, totalPlatform = 0, totalWithdrawn = 0, sales = 0, withdrawals = 0;

    for (const share of shares) {
      if (share.status === "cancelled") continue;
      if (share.status === "paid_out") {
        totalWithdrawn += Number(share.organizationAmount);
        withdrawals++;
      } else {
        totalOrg += Number(share.organizationAmount);
        totalPlatform += Number(share.platformAmount);
        sales++;
      }
    }

    const available = totalOrg - totalWithdrawn;

    if (existing) {
      await this.db
        .update(organizationBalances)
        .set({
          organizationAmount: available.toFixed(2),
          platformAmount: totalPlatform.toFixed(2),
          totalSales: sales,
          totalWithdrawals: withdrawals,
          withdrawnAmount: totalWithdrawn.toFixed(2),
        })
        .where(eq(organizationBalances.organizationId, organizationId));
    } else {
      await this.db.insert(organizationBalances).values({
        organizationId,
        organizationAmount: available.toFixed(2),
        platformAmount: totalPlatform.toFixed(2),
        totalSales: sales,
        totalWithdrawals: withdrawals,
        withdrawnAmount: totalWithdrawn.toFixed(2),
        currency: "XAF",
      });
    }
  }

  // ── Format ────────────────────────────────────────────────────────────

  private formatBalance(b: any): OrganizationBalanceResponse {
    return {
      id: b.id,
      organizationId: b.organizationId,
      organizationAmount: Number(b.organizationAmount),
      platformAmount: Number(b.platformAmount),
      totalSales: b.totalSales,
      totalWithdrawals: b.totalWithdrawals,
      withdrawnAmount: Number(b.withdrawnAmount),
      currency: b.currency,
    };
  }
}
