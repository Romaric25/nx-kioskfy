import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthGuard, Roles } from "@thallesp/nestjs-better-auth";
import { WithdrawalsService } from "./withdrawals.service";
import { CreateWithdrawalDto, CancelWithdrawalDto, PaginationQuery } from "./dto/withdrawal.dto";

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
  @ApiOperation({ summary: "Créer une demande de retrait" })
  create(@Body() dto: CreateWithdrawalDto) { return this.withdrawalsService.create(dto); }

  @Get("organization/:organizationId")
  @ApiOperation({ summary: "Retraits d'une organisation" })
  getByOrg(@Param("organizationId") orgId: string, @Query() q: PaginationQuery) {
    return this.withdrawalsService.getByOrganization(orgId, q.limit ?? 50, q.offset ?? 0);
  }

  @Get(":id")
  @ApiOperation({ summary: "Détail d'un retrait" })
  getById(@Param("id", ParseIntPipe) id: number) { return this.withdrawalsService.getById(id); }

  @Delete(":id")
  @ApiOperation({ summary: "Annuler un retrait" })
  cancel(@Param("id", ParseIntPipe) id: number, @Body() dto?: CancelWithdrawalDto) {
    return this.withdrawalsService.cancel(id, dto?.reason);
  }
}
