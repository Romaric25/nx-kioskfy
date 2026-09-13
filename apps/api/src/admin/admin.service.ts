import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE } from "../db";
import { orders, revenueShares } from "../db/app-schema";
import { users, organizations } from "../db/auth-schema";
import { sql, count } from "drizzle-orm";
import type { Database } from "../db";

export interface AdminDashboardStats {
  totalPlatformRevenue: number;
  totalSalesRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalOrganizations: number;
  activeUsersCount: number;
  growthRate: number;
}

@Injectable()
export class AdminService {
  constructor(@Inject(DRIZZLE) private db: Database) {}

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [platformRev, totalSales, ordersCount, usersCount, orgsCount] =
      await Promise.all([
        this.db
          .select({ value: sql<string>`sum(${revenueShares.platformAmount})` })
          .from(revenueShares)
          .where(sql`${revenueShares.status} != 'cancelled'`),
        this.db
          .select({ value: sql<string>`sum(${revenueShares.totalAmount})` })
          .from(revenueShares)
          .where(sql`${revenueShares.status} != 'cancelled'`),
        this.db.select({ count: count() }).from(orders),
        this.db.select({ count: count() }).from(users),
        this.db.select({ count: count() }).from(organizations),
      ]);

    return {
      totalPlatformRevenue: Number(platformRev[0]?.value || 0),
      totalSalesRevenue: Number(totalSales[0]?.value || 0),
      totalOrders: ordersCount[0].count,
      totalUsers: usersCount[0].count,
      totalOrganizations: orgsCount[0].count,
      activeUsersCount: usersCount[0].count,
      growthRate: 4.5,
    };
  }
}
