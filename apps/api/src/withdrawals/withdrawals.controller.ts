import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthGuard, Roles, Session, type UserSession } from "@thallesp/nestjs-better-auth";
import type { Auth } from "../auth";
import { WithdrawalsService } from "./withdrawals.service";
import {
  CreateWithdrawalDto,
  CancelWithdrawalDto,
  TraiterWithdrawalDto,
  PaginationQuery,
} from "./dto/withdrawal.dto";

type AuthSession = UserSession<Auth>;

@ApiTags("Withdrawals")
@Controller("withdrawals")
@UseGuards(AuthGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Get()
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Admin — Tous les retraits" })
  getAll(@Query() q: PaginationQuery) {
    return this.withdrawalsService.getAll(q.limit ?? 50, q.offset ?? 0);
  }

  @Post()
  @ApiOperation({ summary: "Créer une demande de retrait (propriétaire uniquement)" })
  create(@Session() session: AuthSession, @Body() dto: CreateWithdrawalDto) {
    return this.withdrawalsService.create(dto, session.user.id);
  }

  @Get("organization/:organizationId")
  @ApiOperation({ summary: "Retraits d'une organisation (propriétaire uniquement)" })
  getByOrg(
    @Session() session: AuthSession,
    @Param("organizationId") orgId: string,
    @Query() q: PaginationQuery,
  ) {
    return this.withdrawalsService.getByOrganization(
      orgId,
      session.user.id,
      q.limit ?? 50,
      q.offset ?? 0,
    );
  }

  // Déclaré AVANT `:id` pour ne pas être capturé par la route paramétrée.
  @Get("count/pending")
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Admin — Nombre de retraits à traiter (badge sidebar)" })
  countPending() {
    return this.withdrawalsService.countPending();
  }

  @Get(":id")
  @ApiOperation({ summary: "Détail d'un retrait" })
  getById(@Param("id", ParseIntPipe) id: number) { return this.withdrawalsService.getById(id); }

  @Patch(":id")
  @Roles(["admin", "superadmin"])
  @ApiOperation({
    summary:
      "Admin — Traiter une demande de retrait (payée / échouée / annulée)",
  })
  traiter(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: TraiterWithdrawalDto,
  ) {
    return this.withdrawalsService.traiter(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Annuler un retrait (propriétaire uniquement)" })
  cancel(
    @Session() session: AuthSession,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto?: CancelWithdrawalDto,
  ) {
    return this.withdrawalsService.cancel(id, session.user.id, dto?.reason);
  }
}
