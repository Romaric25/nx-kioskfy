import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE } from "../db";
import { orders, revenueShares } from "../db/app-schema";
import { users, organizations } from "../db/auth-schema";
import { sql, count, and } from "drizzle-orm";
import type { Database } from "../db";

/** Un point de la série de ventes quotidienne. */
export interface AdminSalesPoint {
  /** Date au format YYYY-MM-DD. */
  date: string;
  /** Chiffre d'affaires total du jour (ventes payées). */
  revenue: number;
  /** Commission conservée par la plateforme ce jour-là. */
  platformRevenue: number;
  /** Nombre de ventes payées du jour. */
  sales: number;
}

export interface AdminDashboardStats {
  totalPlatformRevenue: number;
  totalSalesRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalOrganizations: number;
  /** Ventes quotidiennes des 90 derniers jours (ventes payées). */
  salesSeries: AdminSalesPoint[];
}

@Injectable()
export class AdminService {
  constructor(@Inject(DRIZZLE) private db: Database) {}

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [platformRev, totalSales, ordersCount, usersCount, orgsCount, seriesRows] =
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
        this.db
          .select({
            date: sql<string>`DATE(${revenueShares.createdAt})`,
            revenue: sql<string>`SUM(${revenueShares.totalAmount})`,
            platformRevenue: sql<string>`SUM(${revenueShares.platformAmount})`,
            sales: sql<number>`COUNT(${revenueShares.id})`,
          })
          .from(revenueShares)
          .where(
            and(
              sql`${revenueShares.status} != 'cancelled'`,
              sql`${revenueShares.createdAt} >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)`,
            ),
          )
          .groupBy(sql`DATE(${revenueShares.createdAt})`)
          .orderBy(sql`DATE(${revenueShares.createdAt})`),
      ]);

    return {
      totalPlatformRevenue: Number(platformRev[0]?.value || 0),
      totalSalesRevenue: Number(totalSales[0]?.value || 0),
      totalOrders: ordersCount[0].count,
      totalUsers: usersCount[0].count,
      totalOrganizations: orgsCount[0].count,
      salesSeries: seriesRows.map((row) => ({
        date: String(row.date),
        revenue: Number(row.revenue || 0),
        platformRevenue: Number(row.platformRevenue || 0),
        sales: Number(row.sales || 0),
      })),
    };
  }
}
