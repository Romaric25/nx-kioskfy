import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";
import { Session, AuthGuard, Public, type UserSession } from "@thallesp/nestjs-better-auth";
import type { Auth } from "../auth";
import { OrganizationsService } from "./organizations.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";

type AuthSession = UserSession<Auth>;

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

  @Get(":organizationId")
  @ApiOperation({ summary: "Détail d'une organisation (membre uniquement)" })
  getById(
    @Session() session: AuthSession,
    @Param("organizationId") organizationId: string,
  ) {
    return this.organizationsService.getById(session.user.id, organizationId);
  }

  @Put(":organizationId")
  @ApiOperation({ summary: "Modifier une organisation (propriétaire uniquement)" })
  update(
    @Session() session: AuthSession,
    @Param("organizationId") organizationId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(session.user.id, organizationId, dto);
  }

  @Delete(":organizationId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer une organisation (propriétaire uniquement)" })
  async remove(
    @Session() session: AuthSession,
    @Param("organizationId") organizationId: string,
  ) {
    await this.organizationsService.remove(session.user.id, organizationId);
  }

  @Post()
  @ApiOperation({ summary: "Créer une organisation (agence de presse)" })
  create(@Session() session: AuthSession, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(session.user.id, dto);
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
