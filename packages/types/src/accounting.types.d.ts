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
//# sourceMappingURL=accounting.types.d.ts.map