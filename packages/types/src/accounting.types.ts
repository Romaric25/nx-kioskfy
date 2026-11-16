// ── Organization Balance ─────────────────────────────────────────────────

export interface OrganizationBalanceResponse {
  id: number;
  organizationId: string;
  organizationAmount: number;
  platformAmount: number;
  totalSales: number;
  totalWithdrawals: number;
  withdrawnAmount: number;
  currency: string;
}

// ── Organization Stats ───────────────────────────────────────────────────

export interface RecentSale {
  id: string;
  amount: number;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  newspaper: {
    issueNumber: string | null;
    coverImage: string | null;
  } | null;
  createdAt: string;
}

export interface OrganizationStatsResponse {
  totalRevenue: number;
  /** Revenus réels de l'agence après commission plateforme. */
  totalOrgRevenue: number;
  /** Total de la commission conservée par la plateforme. */
  totalPlatformRevenue: number;
  salesCount: number;
  availableBalance: number;
  withdrawnAmount: number;
  payouts: {
    date: string | null;
    amount: number;
    count: number;
  }[];
  recentSales: RecentSale[];
}

// ── Organization Orders ──────────────────────────────────────────────────

/** Commande d'une agence avec la répartition des revenus associée. */
export interface OrganizationOrder {
  id: string;
  price: number;
  status: string;
  paymentId: string | null;
  payeurNom: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  newspaper: {
    issueNumber: string | null;
    coverImage: string | null;
  } | null;
  /** Part de revenus créée au paiement (null si la commande est en attente). */
  revenueShare: {
    totalAmount: number;
    platformAmount: number;
    organizationAmount: number;
  } | null;
}

// ── Customer ─────────────────────────────────────────────────────────────

export interface OrganizationCustomer {
  id: string | null;
  name: string | null;
  email: string;
  image: string | null;
  purchaseCount: number;
}

export interface OrganizationCustomersResponse {
  totalCustomers: number;
  customers: OrganizationCustomer[];
}
