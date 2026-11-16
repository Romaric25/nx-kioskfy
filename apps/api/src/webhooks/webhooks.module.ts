import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";
import { PaymentsModule } from "../payments/payments.module";

/**
 * Webhooks entrants de l'API SaaS PI-SPI : paiements reçus → mise à jour
 * idempotente des commandes (orders) et des parts de revenus.
 */
@Module({
  imports: [PaymentsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
