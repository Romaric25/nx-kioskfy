import { Controller, Get, Post, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";
import { Session, AuthGuard, Public, type UserSession } from "@thallesp/nestjs-better-auth";
import type { auth } from "../auth";
import { OrganizationsService } from "./organizations.service";

type AuthSession = UserSession<typeof auth>;

@ApiTags("Organizations")
@Controller("organizations")
@UseGuards(AuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Liste des organisations" })
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get("slug/:slug")
  @Public()
  @ApiOperation({ summary: "Détail d'une organisation (slug)" })
  findBySlug(@Param("slug") slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  @Get("me")
  @ApiOperation({ summary: "Mes organisations (agences de presse)" })
  getMyOrganizations(@Session() session: AuthSession) {
    return this.organizationsService.getMyOrganizations(session.user.id);
  }

  @Get(":organizationId/balances")
  @ApiOperation({ summary: "Solde d'une organisation" })
  @ApiParam({ name: "organizationId", type: String })
  getBalances(@Param("organizationId") organizationId: string) {
    return this.organizationsService.getOrCreateBalance(organizationId);
  }

  @Post(":organizationId/sync-balances")
  @ApiOperation({ summary: "Synchroniser les soldes depuis les revenue shares" })
  @ApiParam({ name: "organizationId", type: String })
  async syncBalances(@Param("organizationId") organizationId: string) {
    await this.organizationsService.syncFromRevenueShares(organizationId);
    return this.organizationsService.getBalances(organizationId);
  }
}
