import { Body, Controller, Post, Req } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "@thallesp/nestjs-better-auth";
import type { Request } from "express";
import { Logger, BadRequestException } from "@nestjs/common";
import { WebhooksService, type PaiementRecuWebhook } from "./webhooks.service";

/**
 * Point de réception des notifications de l'API SaaS PI-SPI.
 *
 * Sécurité : la signature HMAC-SHA256 (`X-Signature`) du corps brut est
 * vérifiée avec le secret partagé `PISPI_WEBHOOK_SECRET`. Le corps brut
 * (`req.rawBody`) est conservé grâce au `rawBody: true` du module Auth.
 */
@ApiTags("webhooks")
@Public() // authentifié par la signature HMAC, pas par une session
@Controller("webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooks: WebhooksService) {}

  @Post("pispi")
  @ApiOperation({
    summary: "Reçoit les notifications signées de l'API SaaS PI-SPI",
  })
  async recevoir(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: PaiementRecuWebhook,
  ) {
    const signature = req.header("x-signature");
    const corpsBrut: string | Buffer = req.rawBody ?? JSON.stringify(body);

    if (!this.webhooks.verifierSignature(corpsBrut, signature)) {
      this.logger.warn(
        "Notification PI-SPI avec signature invalide rejetée — vérifiez que " +
          "PISPI_WEBHOOK_SECRET est défini et identique au callbackSecret " +
          "envoyé à l'API SaaS (sinon le secret de la notification ne peut pas être vérifié)",
      );
      throw new BadRequestException("Signature invalide");
    }

    const evenement = body.event ?? "INCONNU";
    this.logger.log(`Notification ${evenement} reçue`);
    await this.webhooks.traiter(evenement, body);
    return { received: true, event: evenement };
  }
}
