import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DRIZZLE } from "../db";
import { orders, revenueShares, organizationBalances } from "../db/app-schema";
import { eq, sql } from "drizzle-orm";
import type { Database } from "../db";

const PLATFORM_PERCENTAGE = 25;
const ORGANIZATION_PERCENTAGE = 75;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly config: ConfigService,
    @Inject(DRIZZLE) private db: Database,
  ) {}

  private get host() { return this.config.getOrThrow<string>("MONEROO_HOST"); }
  private get secretKey() { return this.config.getOrThrow<string>("MONEROO_SECRET_KEY"); }

  async initializePayment(body: any) {
    const res = await fetch(`${this.host}/payments/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.secretKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Moneroo API Error: ${await res.text()}`);
    return res.json();
  }

  async verifyPayment(paymentId: string) {
    const res = await fetch(`${this.host}/payments/${paymentId}/verify`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    if (!res.ok) throw new Error(`Moneroo API Error: ${await res.text()}`);
    return res.json();
  }

  async processSuccess(paymentId: string) {
    const found = await this.db.query.orders.findMany({
      where: eq(orders.paymentId, paymentId),
      with: { newspaper: { with: { organization: true, country: true } } },
    });

    if (!found.length) throw new NotFoundException(`No orders for payment ${paymentId}`);

    await this.db.update(orders).set({ status: "completed", updatedAt: new Date() }).where(eq(orders.paymentId, paymentId));

    await Promise.all(found.map(async (order) => {
      const orgId = order.newspaper?.organizationId;
      if (!orgId) return;

      const total = parseFloat(order.price);
      const platformAmount = (total * PLATFORM_PERCENTAGE) / 100;
      const orgAmount = (total * ORGANIZATION_PERCENTAGE) / 100;
      const currency = order.newspaper?.country?.currency || "XAF";

      await this.db.insert(revenueShares).values({
        orderId: order.id,
        organizationId: orgId,
        totalAmount: total.toFixed(2),
        platformAmount: platformAmount.toFixed(2),
        organizationAmount: orgAmount.toFixed(2),
        platformPercentage: PLATFORM_PERCENTAGE.toFixed(2),
        organizationPercentage: ORGANIZATION_PERCENTAGE.toFixed(2),
        currency,
        status: "processed",
        processedAt: new Date(),
      });

      const result = await this.db.update(organizationBalances).set({
        organizationAmount: sql`${organizationBalances.organizationAmount} + ${orgAmount.toFixed(2)}`,
        platformAmount: sql`${organizationBalances.platformAmount} + ${platformAmount.toFixed(2)}`,
        totalSales: sql`${organizationBalances.totalSales} + 1`,
      }).where(eq(organizationBalances.organizationId, orgId));

      if (result[0].affectedRows === 0) {
        await this.db.insert(organizationBalances).values({
          organizationId: orgId,
          organizationAmount: orgAmount.toFixed(2),
          platformAmount: platformAmount.toFixed(2),
          totalSales: 1,
          totalWithdrawals: 0,
          withdrawnAmount: "0.00",
          currency,
        });
      }
    }));

    return { orderIds: found.map((o) => o.id) };
  }
}
