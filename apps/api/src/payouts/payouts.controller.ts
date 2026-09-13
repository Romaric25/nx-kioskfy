import { Controller, Post, Get, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@thallesp/nestjs-better-auth";
import { PayoutsService } from "./payouts.service";
import { InitializePayoutDto } from "./dto/payout.dto";

@ApiTags("Payouts")
@Controller("payouts")
@UseGuards(AuthGuard)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post("initialize")
  @ApiOperation({ summary: "Initialiser un payout Moneroo" })
  initialize(@Body() dto: InitializePayoutDto) {
    return this.payoutsService.initializePayout(dto);
  }

  @Get(":payoutId/verify")
  @ApiOperation({ summary: "Vérifier un payout Moneroo" })
  verify(@Param("payoutId") payoutId: string) {
    return this.payoutsService.verifyPayout(payoutId);
  }
}
