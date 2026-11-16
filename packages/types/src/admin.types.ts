// ── Admin Dashboard ──────────────────────────────────────────────────────

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

/** Statistiques du dashboard admin (GET /admin/stats). */
export interface AdminStatsResponse {
  totalPlatformRevenue: number;
  totalSalesRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalOrganizations: number;
  /** Ventes quotidiennes des 90 derniers jours. */
  salesSeries: AdminSalesPoint[];
}
