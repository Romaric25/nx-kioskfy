import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { DRIZZLE } from "../db";
import {
  organizationBalances,
  revenueShares,
  newspapers,
  withdrawals,
  siteSettings,
} from "../db/app-schema";
import { members, organizations, users } from "../db/auth-schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Database } from "../db";
import type { OrganizationItem } from "@kioskfy/types";
import type { CreateOrganizationDto } from "./dto/create-organization.dto";
import type { UpdateOrganizationDto } from "./dto/update-organization.dto";

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
   * via their Better Auth membership. Chaque agence est renvoyée avec le
   * rôle du membre connecté (`owner`, `admin`, …) pour gérer les accès
   * côté client (ex. demande de retrait réservée au propriétaire).
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

    return rows.map((org) => ({
      ...this.mapOrganization(org),
      role:
        memberships.find((m) => m.organizationId === org.id)?.role ?? null,
    }));
  }

  /** Détail d'une organisation pour l'un de ses membres. */
  async getById(userId: string, organizationId: string): Promise<OrganizationItem> {
    const membership = await this.db.query.members.findFirst({
      where: and(
        eq(members.organizationId, organizationId),
        eq(members.userId, userId),
      ),
    });
    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });
    if (!org) throw new NotFoundException("Organisation non trouvée");

    return this.mapOrganization(org);
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
          pispiAlias: dto.pispiAlias ?? null,
          newspaperPrice: dto.newspaperPrice
            ? String(dto.newspaperPrice)
            : null,
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
    } catch (error) {
      // Seul un vrai doublon (contrainte d'unicité MySQL ER_DUP_ENTRY)
      // doit être converti en 409 — les autres erreurs remontent telles quelles
      // (ex. colonne manquante, connexion…).
      if ((error as { code?: string })?.code === "ER_DUP_ENTRY") {
        throw new ConflictException(
          "Une organisation avec ce nom, cet email ou ce téléphone existe déjà",
        );
      }
      throw error;
    }

    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, id),
    });
    if (!org) throw new NotFoundException("Impossible de créer l'organisation");

    return this.mapOrganization(org);
  }

  /**
   * Modify an agency (owner only). Seuls les champs fournis sont mis à
   * jour ; le slug n'est pas modifié (stabilité des URL publiques).
   */
  async update(
    userId: string,
    organizationId: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationItem> {
    await this.assertOwner(userId, organizationId);

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.email !== undefined) updates.email = dto.email;
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.country !== undefined) updates.country = dto.country;
    if (dto.address !== undefined) updates.address = dto.address;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.price !== undefined) updates.price = dto.price;
    if (dto.logo !== undefined) updates.logo = dto.logo;
    if (dto.logoUploadId !== undefined) updates.logoUploadId = dto.logoUploadId;
    if (dto.pispiAlias !== undefined) updates.pispiAlias = dto.pispiAlias;
    if (dto.newspaperPrice !== undefined) {
      updates.newspaperPrice =
        dto.newspaperPrice === null ? null : String(dto.newspaperPrice);
    }
    if (dto.metadata !== undefined) updates.metadata = dto.metadata;

    if (Object.keys(updates).length === 0) {
      const unchanged = await this.db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      });
      if (!unchanged) throw new NotFoundException("Organisation non trouvée");
      return this.mapOrganization(unchanged);
    }

    try {
      await this.db
        .update(organizations)
        .set(updates)
        .where(eq(organizations.id, organizationId));
    } catch (error) {
      // Seul un vrai doublon (contrainte d'unicité MySQL ER_DUP_ENTRY)
      // doit être converti en 409 — les autres erreurs remontent telles quelles.
      if ((error as { code?: string })?.code === "ER_DUP_ENTRY") {
        throw new ConflictException(
          "Une organisation avec cet email ou ce téléphone existe déjà",
        );
      }
      throw error;
    }

    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });
    if (!org) throw new NotFoundException("Organisation non trouvée");

    return this.mapOrganization(org);
  }

  /**
   * Delete an agency (owner only). Refusée tant que l'agence possède des
   * journaux ou des demandes de retrait (intégrité référentielle) ; les
   * soldes et parts de revenus sont nettoyés dans la même transaction.
   */
  async remove(userId: string, organizationId: string): Promise<void> {
    await this.assertOwner(userId, organizationId);

    const papers = await this.db
      .select({ id: newspapers.id })
      .from(newspapers)
      .where(eq(newspapers.organizationId, organizationId))
      .limit(1);
    if (papers.length > 0) {
      throw new ConflictException(
        "Supprimez d'abord les journaux de cette agence",
      );
    }

    const retraits = await this.db
      .select({ id: withdrawals.id })
      .from(withdrawals)
      .where(eq(withdrawals.organizationId, organizationId))
      .limit(1);
    if (retraits.length > 0) {
      throw new ConflictException(
        "Impossible de supprimer : l'agence a des demandes de retrait en historique",
      );
    }

    await this.db.transaction(async (tx) => {
      await tx
        .delete(revenueShares)
        .where(eq(revenueShares.organizationId, organizationId));
      await tx
        .delete(organizationBalances)
        .where(eq(organizationBalances.organizationId, organizationId));
      await tx
        .delete(members)
        .where(eq(members.organizationId, organizationId));
      await tx
        .delete(organizations)
        .where(eq(organizations.id, organizationId));
    });
  }

  /**
   * Vérifie que l'utilisateur est le propriétaire (role `owner`) de
   * l'agence. Utilisé pour protéger les actions sensibles : modification,
   * suppression et demandes de retrait.
   */
  async assertOwner(userId: string, organizationId: string): Promise<void> {
    const membership = await this.db.query.members.findFirst({
      where: and(
        eq(members.organizationId, organizationId),
        eq(members.userId, userId),
      ),
    });
    if (!membership || membership.role !== "owner") {
      throw new ForbiddenException(
        "Seul le propriétaire de l'agence peut effectuer cette action",
      );
    }
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
      pispiAlias: org.pispiAlias ?? null,
      newspaperPrice:
        org.newspaperPrice === null || org.newspaperPrice === undefined
          ? null
          : Number(org.newspaperPrice),
      metadata: org.metadata,
    };
  }

  // ── Balances ──────────────────────────────────────────────────────────

  async getOrCreateBalance(organizationId: string): Promise<OrganizationBalanceResponse> {
    const currency = await this.devise();
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
        currency,
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
    currency?: string,
  ): Promise<void> {
    const devise = currency ?? (await this.devise());
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
        currency: devise,
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

  /** Inverse de `recordWithdrawal` : restaure le solde d'un retrait annulé. */
  async annulerRetrait(organizationId: string, amount: number): Promise<void> {
    await this.db
      .update(organizationBalances)
      .set({
        organizationAmount: sql`${organizationBalances.organizationAmount} + ${amount.toFixed(2)}`,
        withdrawnAmount: sql`${organizationBalances.withdrawnAmount} - ${amount.toFixed(2)}`,
        totalWithdrawals: sql`${organizationBalances.totalWithdrawals} - 1`,
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
        currency: await this.devise(),
      });
    }
  }

  // ── Format ────────────────────────────────────────────────────────────

  /** Devise du site, configurée dans les paramètres (fallback XAF). */
  private async devise(): Promise<string> {
    const [setting] = await this.db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, "currency"));
    return setting?.value && setting.value.trim() !== ""
      ? setting.value.trim()
      : "XAF";
  }

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
