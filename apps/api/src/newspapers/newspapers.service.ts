import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { DRIZZLE } from "../db";
import { newspapers, newspapersCategories, countries, categories } from "../db/app-schema";
import { organizations, members } from "../db/auth-schema";
import { eq, and, or, like, inArray, sql } from "drizzle-orm";
import type { Database } from "../db";
import { CreateNewspaperDto, UpdateNewspaperDto, NewspaperStatus } from "./dto/newspaper.dto";

/** Minimal shape of the authenticated user (from the session). */
interface ActorUser {
  id: string;
  role?: string | null;
}

@Injectable()
export class NewspapersService {
  constructor(@Inject(DRIZZLE) private db: Database) {}

  // ── Public queries ────────────────────────────────────────────────────

  async getPublished() {
    return this.db.query.newspapers.findMany({
      where: eq(newspapers.status, "published" as any),
      with: { organization: true, country: true, coverImageUpload: true, pdfUpload: true, categories: { with: { category: true } } },
      orderBy: (n, { desc }) => [desc(n.publishDate)],
    });
  }

  async getPublishedPaginated(options: { limit?: number; cursor?: number; type?: string; search?: string } = {}) {
    const { limit = 12, cursor = 0, search } = options;
    const conditions: any[] = [eq(newspapers.status, "published" as any)];
    if (search) {
      // Match by issue number OR by organization name.
      const matchingOrgs = await this.db.query.organizations.findMany({
        where: like(organizations.name, `%${search}%`),
        columns: { id: true },
      });
      const orgIds = matchingOrgs.map((org) => org.id);
      conditions.push(
        or(
          like(newspapers.issueNumber, `%${search}%`),
          orgIds.length > 0
            ? inArray(newspapers.organizationId, orgIds)
            : sql`1 = 0`,
        ),
      );
    }
    const rows = await this.db.query.newspapers.findMany({
      where: and(...conditions),
      with: { organization: true, country: true, categories: { with: { category: true } } },
      orderBy: (n, { desc }) => [desc(n.publishDate)],
      limit: limit + 1,
      offset: cursor,
    });
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    return { data: rows, nextCursor: hasMore ? cursor + limit : null };
  }

  async getById(id: string) {
    const row = await this.db.query.newspapers.findFirst({
      where: eq(newspapers.id, id),
      with: { organization: true, country: true, pdfUpload: true, coverImageUpload: true, categories: { with: { category: true } } },
    });
    if (!row) throw new NotFoundException("Journal non trouvé");
    return row;
  }

  async getByOrganization(orgId: string, options: { limit?: number; cursor?: number; excludeId?: string; includeAllStatuses?: boolean } = {}) {
    const { limit = 6, cursor = 0, excludeId, includeAllStatuses } = options;
    const conditions: any[] = [eq(newspapers.organizationId, orgId)];
    if (!includeAllStatuses) conditions.push(eq(newspapers.status, "published" as any));
    const rows = await this.db.query.newspapers.findMany({
      where: and(...conditions),
      with: { organization: true, country: true },
      orderBy: (n, { desc }) => [desc(n.publishDate)],
      limit: limit + 1,
      offset: cursor,
    });
    const filtered = excludeId ? rows.filter((r) => r.id !== excludeId) : rows;
    const hasMore = filtered.length > limit;
    if (hasMore) filtered.pop();
    return { data: filtered, nextCursor: hasMore ? cursor + limit : null };
  }

  async getByCountrySlug(slug: string, options: { limit?: number; cursor?: number; search?: string } = {}) {
    const country = await this.db.query.countries.findFirst({ where: eq(countries.slug, slug) });
    if (!country) throw new NotFoundException("Pays non trouvé");
    const { limit = 12, cursor = 0, search } = options;
    const conditions: any[] = [
      eq(newspapers.countryId, country.id),
      eq(newspapers.status, "published" as any),
    ];
    if (search) {
      // Match by issue number OR by organization name.
      const matchingOrgs = await this.db.query.organizations.findMany({
        where: like(organizations.name, `%${search}%`),
        columns: { id: true },
      });
      const orgIds = matchingOrgs.map((org) => org.id);
      conditions.push(
        or(
          like(newspapers.issueNumber, `%${search}%`),
          orgIds.length > 0
            ? inArray(newspapers.organizationId, orgIds)
            : sql`1 = 0`,
        ),
      );
    }
    const rows = await this.db.query.newspapers.findMany({
      where: and(...conditions),
      with: { organization: true, country: true, categories: { with: { category: true } } },
      orderBy: (n, { desc }) => [desc(n.publishDate)],
      limit: limit + 1,
      offset: cursor,
    });
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    return { data: rows, country: { id: country.id, name: country.name, slug: country.slug, flag: country.flag }, nextCursor: hasMore ? cursor + limit : null };
  }

  async getByCategory(slug: string, options: { limit?: number; cursor?: number; search?: string } = {}) {
    const cat = await this.db.query.categories.findFirst({ where: eq(categories.slug, slug) });
    if (!cat) throw new NotFoundException("Catégorie non trouvée");
    const { limit = 12, cursor = 0 } = options;
    const junctionRows = await this.db.query.newspapersCategories.findMany({
      where: eq(newspapersCategories.categoriesId, cat.id),
      with: { newspaper: { with: { organization: true, country: true, categories: { with: { category: true } } } } },
      limit: limit + 1,
      offset: cursor,
    });
    const rows = junctionRows.map((j) => j.newspaper).filter(Boolean);
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    return { data: rows, nextCursor: hasMore ? cursor + limit : null };
  }

  // ── Admin ─────────────────────────────────────────────────────────────

  async getAll() {
    return this.db.query.newspapers.findMany({
      with: { organization: true, country: true },
      orderBy: (n, { desc }) => [desc(n.createdAt)],
      extras: { salesCount: sql<number>`(SELECT COUNT(*) FROM orders WHERE orders.newspaperId = newspapers.id AND orders.status = 'completed')`.as("salesCount") },
    });
  }

  async create(user: ActorUser, dto: CreateNewspaperDto) {
    await this.ensureCanManageOrganization(user, dto.organizationId);

    const country = await this.db.query.countries.findFirst({ where: eq(countries.name, dto.country) });
    if (!country) throw new BadRequestException("Pays non trouvé");

    const id = randomUUID();

    await this.db.insert(newspapers).values({
      id,
      issueNumber: dto.issueNumber,
      publishDate: new Date(dto.publishDate),
      coverImage: "",
      price: String(dto.price),
      status: dto.status as any,
      pdf: "",
      organizationId: dto.organizationId,
      countryId: country.id,
      coverImageUploadId: dto.coverImageUploadId ?? null,
      pdfUploadId: dto.pdfUploadId ?? null,
      autoPublish: dto.autoPublish ?? false,
    } as any);

    if (dto.categoryIds?.length) {
      await this.db.insert(newspapersCategories).values(
        dto.categoryIds.map((catId) => ({ newspapersId: id, categoriesId: catId })),
      );
    }
    return { id };
  }

  async update(user: ActorUser, id: string, dto: UpdateNewspaperDto) {
    const newspaper = await this.getById(id);
    await this.ensureCanManageOrganization(user, newspaper.organizationId);
    const data: Record<string, unknown> = {};
    if (dto.issueNumber) data.issueNumber = dto.issueNumber;
    if (dto.publishDate) data.publishDate = new Date(dto.publishDate);
    if (dto.price !== undefined) data.price = String(dto.price);
    if (dto.status) data.status = dto.status;
    if (dto.organizationId) data.organizationId = dto.organizationId;
    if (dto.coverImageUploadId !== undefined) data.coverImageUploadId = dto.coverImageUploadId;
    if (dto.pdfUploadId !== undefined) data.pdfUploadId = dto.pdfUploadId;
    if (dto.country) {
      const country = await this.db.query.countries.findFirst({ where: eq(countries.name, dto.country) });
      if (country) data.countryId = country.id;
    }

    if (Object.keys(data).length > 0) {
      await this.db.update(newspapers).set(data).where(eq(newspapers.id, id));
    }

    if (dto.categoryIds) {
      await this.db.delete(newspapersCategories).where(eq(newspapersCategories.newspapersId, id));
      if (dto.categoryIds.length > 0) {
        await this.db.insert(newspapersCategories).values(
          dto.categoryIds.map((catId) => ({ newspapersId: id, categoriesId: catId })),
        );
      }
    }
  }

  async updateStatus(user: ActorUser, id: string, status: NewspaperStatus) {
    const newspaper = await this.getById(id);
    await this.ensureCanManageOrganization(user, newspaper.organizationId);
    await this.db.update(newspapers).set({ status } as any).where(eq(newspapers.id, id));
  }

  async delete(user: ActorUser, id: string) {
    const newspaper = await this.getById(id);
    await this.ensureCanManageOrganization(user, newspaper.organizationId);
    await this.db.delete(newspapersCategories).where(eq(newspapersCategories.newspapersId, id));
    await this.db.delete(newspapers).where(eq(newspapers.id, id));
  }

  /**
   * Admins can manage every organization. Other users must be an
   * owner/admin member of the organization (Better Auth membership).
   */
  private async ensureCanManageOrganization(user: ActorUser, organizationId: string | null) {
    if (user.role === "admin" || user.role === "superadmin") return;

    if (!organizationId) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à gérer cette organisation");
    }

    const membership = await this.db.query.members.findFirst({
      where: and(
        eq(members.organizationId, organizationId),
        eq(members.userId, user.id),
      ),
    });

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à gérer cette organisation");
    }
  }

  // ── Cron ──────────────────────────────────────────────────────────────

  async publishAllDrafts() {
    const drafts = await this.db.query.newspapers.findMany({
      where: and(eq(newspapers.status, "draft" as any), eq(newspapers.autoPublish, true)),
    });
    if (drafts.length === 0) return { publishedCount: 0 };
    await this.db.update(newspapers).set({ status: "published" as any }).where(
      and(eq(newspapers.status, "draft" as any), eq(newspapers.autoPublish, true)),
    );
    return { publishedCount: drafts.length };
  }
}
