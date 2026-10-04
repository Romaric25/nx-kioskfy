import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { DRIZZLE } from "../db";
import { organizationBalances, revenueShares } from "../db/app-schema";
import { members, organizations, users } from "../db/auth-schema";
import { eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Database } from "../db";
import type { OrganizationItem } from "@kioskfy/types";
import type { CreateOrganizationDto } from "./dto/create-organization.dto";

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

  /**
   * Create a press agency for the current user (mirrors Better Auth's
   * `allowUserToCreateOrganization` rule: active `agency` users only) and
   * attach the creator as owner member.
   */
  async create(userId: string, dto: CreateOrganizationDto): Promise<OrganizationItem> {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw new NotFoundException("Utilisateur non trouvé");
    if (user.typeUser !== "agency") {
      throw new ForbiddenException("Seuls les comptes partenaires peuvent créer une organisation");
    }
    if (!user.isActive) {
      throw new ForbiddenException("Votre compte n'est pas encore actif");
    }

    const id = randomUUID();
    const slug = await this.generateUniqueSlug(dto.slug || dto.name);

    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(organizations).values({
          id,
          name: dto.name,
          slug,
          logo: dto.logo ?? null,
          logoUploadId: dto.logoUploadId ?? null,
          email: dto.email,
          phone: dto.phone,
          country: dto.country,
          address: dto.address,
          description: dto.description,
          price: dto.price ?? null,
          metadata: dto.metadata ?? null,
          suspended: false,
        });
        await tx.insert(members).values({
          id: randomUUID(),
          organizationId: id,
          userId,
          role: "owner",
          createdAt: new Date(),
        });
      });
    } catch {
      // Slug, email ou téléphone déjà utilisés (contraintes d'unicité).
      throw new ConflictException(
        "Une organisation avec ce nom, cet email ou ce téléphone existe déjà",
      );
    }

    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, id),
    });
    if (!org) throw new NotFoundException("Impossible de créer l'organisation");

    return this.mapOrganization(org);
  }

  /** Slugify the organization name and ensure uniqueness. */
  private async generateUniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .substring(0, 50) || "organisation";

    let slug = base;
    let suffix = 1;
    while (
      await this.db.query.organizations.findFirst({
        where: eq(organizations.slug, slug),
      })
    ) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
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
