import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Public } from "@thallesp/nestjs-better-auth";
import { PaymentsService } from "./payments.service";
import {
  InitializePaymentDto,
  PaymentSuccessDto,
  PispiConfirmDto,
  PispiReglementDto,
} from "./dto/payment.dto";

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

  @Post("pispi/confirm")
  @Public()
  @ApiOperation({
    summary:
      "Confirmer un paiement PI-SPI : vérifie le statut de la demande auprès de l'API SaaS puis marque les commandes payées",
  })
  confirmPispi(@Body() dto: PispiConfirmDto) {
    return this.paymentsService.confirmPispiPayment(dto.txId);
  }

  @Post("pispi/reglement")
  @Public()
  @ApiOperation({
    summary:
      "Crée le règlement escrow chez l'API SaaS PI-SPI pour le txId donné " +
      "(le SaaS notifiera cette API par webhook au PAIEMENT_RECU)",
  })
  creerReglement(@Body() dto: PispiReglementDto) {
    return this.paymentsService.creerReglementSaaS(dto.txId);
  }

  @Get("statut/:paymentId")
  @Public()
  @ApiOperation({
    summary:
      "Statut consolidé d'un paiement par paymentId (utilisé par la page de " +
      "succès pour décider de la redirection)",
  })
  statutPaiement(@Param("paymentId") paymentId: string) {
    return this.paymentsService.statutPaiement(paymentId);
  }
}
