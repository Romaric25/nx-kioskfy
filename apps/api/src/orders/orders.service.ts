import { Injectable, Inject } from "@nestjs/common";
import { randomUUID } from "crypto";
import { DRIZZLE } from "../db";
import { orders, revenueShares, newspapers } from "../db/app-schema";
import { users } from "../db/auth-schema";
import { eq, and, count, sum, desc, sql } from "drizzle-orm";
import type { Database } from "../db";

@Injectable()
export class OrdersService {
  constructor(@Inject(DRIZZLE) private db: Database) {}

  async getAll(limit = 50, offset = 0, status?: string) {
    const conditions: any[] = [];
    if (status) conditions.push(eq(orders.status as any, status));

    return this.db.query.orders.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { newspaper: { with: { organization: true } }, user: true },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      limit,
      offset,
    });
  }

  async create(userId: string, newspaperId: string, price: number) {
    const id = randomUUID();
    await this.db.insert(orders).values({ id, userId, newspaperId, price: String(price), status: "pending" as any });
    return this.db.query.orders.findFirst({ where: eq(orders.id, id) });
  }

  async createBatch(userId: string, items: { newspaperId: string; price: number }[]) {
    return Promise.all(items.map((item) => this.create(userId, item.newspaperId, item.price)));
  }

  async updatePaymentId(orderId: string, paymentId: string) {
    await this.db.update(orders).set({ paymentId }).where(eq(orders.id, orderId));
  }

  async updatePaymentIdBatch(orderIds: string[], paymentId: string) {
    await this.db.update(orders).set({ paymentId }).where(
      sql`${orders.id} IN (${orderIds.map((id) => sql`${id}`)})` as any,
    );
  }

  async getByUserId(userId: string) {
    return this.db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: { newspaper: { with: { organization: true } } },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
    });
  }

  async hasUserPurchased(userId: string, newspaperId: string): Promise<boolean> {
    const result = await this.db.query.orders.findFirst({
      where: and(eq(orders.userId, userId), eq(orders.newspaperId, newspaperId), eq(orders.status as any, "completed")),
    });
    return !!result;
  }

  async getOrganizationStats(organizationId: string) {
    const [statsRow] = await this.db
      .select({ totalRevenue: sum(revenueShares.totalAmount), totalSales: count(revenueShares.id) })
      .from(revenueShares)
      .where(and(eq(revenueShares.organizationId, organizationId), sql`${revenueShares.status} != 'cancelled'`));

    const publishedCount = await this.db.$count(newspapers, and(eq(newspapers.organizationId, organizationId), eq(newspapers.status as any, "published")));

    const recentSales = await this.db.query.orders.findMany({
      where: sql`${orders.newspaperId} IN (SELECT id FROM newspapers WHERE organizationId = ${organizationId})` as any,
      with: { user: true, newspaper: true },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      limit: 5,
    });

    return {
      totalRevenue: Number(statsRow?.totalRevenue || 0),
      totalSales: statsRow?.totalSales || 0,
      publishedCount,
      recentSales,
    };
  }

  async getOrganizationCustomers(organizationId: string) {
    const rows = await this.db
      .select({
        userId: orders.userId,
        totalOrders: count(orders.id),
        totalSpent: sum(orders.price),
      })
      .from(orders)
      .innerJoin(newspapers, eq(orders.newspaperId, newspapers.id))
      .where(eq(newspapers.organizationId, organizationId))
      .groupBy(orders.userId)
      .orderBy(desc(count(orders.id)));

    const customerIds = rows.map((r) => r.userId);
    const userRows = customerIds.length
      ? await this.db.select().from(users).where(sql`${users.id} IN (${customerIds.map((id) => sql`${id}`)})`)
      : [];

    const userMap = new Map(userRows.map((u) => [u.id, u]));

    return {
      totalCustomers: rows.length,
      customers: rows.map((r) => ({ user: userMap.get(r.userId!)!, totalOrders: r.totalOrders, totalSpent: Number(r.totalSpent || 0) })),
    };
  }
}
