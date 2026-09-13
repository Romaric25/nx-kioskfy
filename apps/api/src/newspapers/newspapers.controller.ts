import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Session, AuthGuard, Roles, Public, type UserSession } from "@thallesp/nestjs-better-auth";
import type { auth } from "../auth";
import { NewspapersService } from "./newspapers.service";
import { CreateNewspaperDto, UpdateNewspaperDto, UpdateStatusDto, PaginationQuery } from "./dto/newspaper.dto";

type AuthSession = UserSession<typeof auth>;

@ApiTags("Newspapers")
@Controller("newspapers")
export class NewspapersController {
  constructor(private readonly newspapersService: NewspapersService) {}

  // ── Public ──────────────────────────────────────────────────

  @Get("all-published")
  @Public()
  @ApiOperation({ summary: "Tous les journaux/magazines publiés" })
  getAllPublished() { return this.newspapersService.getPublished(); }

  @Get("published-paginated")
  @Public()
  @ApiOperation({ summary: "Journaux publiés (paginé)" })
  getPaginated(@Query() q: PaginationQuery) {
    return this.newspapersService.getPublishedPaginated({
      limit: q.limit ?? 12,
      cursor: q.cursor ?? 0,
      type: q.type,
      search: q.search,
    });
  }

  @Get("country/:slug")
  @Public()
  @ApiOperation({ summary: "Par pays (slug)" })
  getByCountrySlug(@Param("slug") slug: string, @Query() q: PaginationQuery) {
    return this.newspapersService.getByCountrySlug(slug, {
      limit: q.limit ?? 12,
      cursor: q.cursor ?? 0,
      search: q.search,
    });
  }

  @Get("category/:slug")
  @Public()
  @ApiOperation({ summary: "Par catégorie (slug)" })
  getByCategory(@Param("slug") slug: string, @Query() q: PaginationQuery) {
    return this.newspapersService.getByCategory(slug, {
      limit: q.limit ?? 12,
      cursor: q.cursor ?? 0,
    });
  }

  @Get("organization/:organizationId")
  @ApiOperation({ summary: "Par organisation (paginé)" })
  getByOrg(@Param("organizationId") orgId: string, @Query() q: PaginationQuery) {
    return this.newspapersService.getByOrganization(orgId, {
      limit: q.limit ?? 6,
      cursor: q.cursor ?? 0,
      excludeId: q.excludeId,
      includeAllStatuses: q.includeAllStatuses === "true",
    });
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Détail d'un journal" })
  getById(@Param("id") id: string) { return this.newspapersService.getById(id); }

  // ── Admin (protégé) ─────────────────────────────────────────

  @Get()
  @UseGuards(AuthGuard)
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Admin — Tous les journaux" })
  getAll() { return this.newspapersService.getAll(); }

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Créer un journal (admin ou propriétaire d'agence)" })
  create(@Session() session: AuthSession, @Body() dto: CreateNewspaperDto) {
    return this.newspapersService.create(session.user, dto);
  }

  @Put(":id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Modifier un journal (admin ou propriétaire d'agence)" })
  update(@Session() session: AuthSession, @Param("id") id: string, @Body() dto: UpdateNewspaperDto) {
    return this.newspapersService.update(session.user, id, dto);
  }

  @Patch(":id/status")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Changer le statut (admin ou propriétaire d'agence)" })
  updateStatus(@Session() session: AuthSession, @Param("id") id: string, @Body() dto: UpdateStatusDto) {
    return this.newspapersService.updateStatus(session.user, id, dto.status);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Supprimer un journal (admin ou propriétaire d'agence)" })
  remove(@Session() session: AuthSession, @Param("id") id: string) {
    return this.newspapersService.delete(session.user, id);
  }

  // ── Cron ────────────────────────────────────────────────────

  @Get("cron/publish-drafts")
  @Public()
  @ApiOperation({ summary: "Cron — Publier les brouillons" })
  async publishDrafts() { return this.newspapersService.publishAllDrafts(); }
}
