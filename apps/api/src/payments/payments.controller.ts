import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Public } from "@thallesp/nestjs-better-auth";
import { PaymentsService } from "./payments.service";
import { InitializePaymentDto, PaymentSuccessDto } from "./dto/payment.dto";

@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("initialize")
  @Public()
  @ApiOperation({ summary: "Initialiser un paiement Moneroo" })
  initialize(@Body() dto: InitializePaymentDto) {
    return this.paymentsService.initializePayment(dto);
  }

  @Get("verify/:paymentId")
  @Public()
  @ApiOperation({ summary: "Vérifier un paiement Moneroo" })
  verify(@Param("paymentId") paymentId: string) {
    return this.paymentsService.verifyPayment(paymentId);
  }

  @Post("success")
  @Public()
  @ApiOperation({ summary: "Marquer un paiement réussi et créer les revenue shares" })
  success(@Body() dto: PaymentSuccessDto) {
    return this.paymentsService.processSuccess(dto.paymentId);
  }
}
