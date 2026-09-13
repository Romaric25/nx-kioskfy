// @kioskfy/types — Shared TypeScript types
//
// Usage:
//   import type { NewspaperItem, OrderItem, OrganizationItem } from '@kioskfy/types';
//   import type { InitializePaymentInput, MonerooCustomer } from '@kioskfy/types/payment';
//   import type { OrganizationBalanceResponse } from '@kioskfy/types/accounting';

// ── Domain ───────────────────────────────────────────────────────────────

export type {
  // Newspaper
  NewspaperItem,
  CreateNewspaperInput,
  UpdateNewspaperInput,
  // Order
  OrderItem,
  AdminOrderResponse,
  CreateOrderInput,
  BatchOrderInput,
  // Organization
  OrganizationItem,
  PublicAgency,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  // Withdrawal
  WithdrawalStatus,
  WithdrawalItem,
  CreateWithdrawalInput,
  // Category
  CategoryItem,
  // Country
  CountryItem,
  CountryWithFavoriteStatus,
  // User
  UserProfile,
  // Upload
  UploadItem,
  PresignedUploadResult,
  // Settings
  SiteSetting,
} from "./domain.types";

// ── Payment ──────────────────────────────────────────────────────────────

export type {
  MonerooCustomer,
  InitializePaymentInput,
  MonerooPaymentResponse,
  MonerooPaymentVerifyResponse,
  InitializePayoutInput,
  PaymentResponse,
  VerifyTransactionResponse,
} from "./payment.types";

// ── Accounting ───────────────────────────────────────────────────────────

export type {
  OrganizationBalanceResponse,
  OrganizationStatsResponse,
  RecentSale,
  OrganizationCustomer,
  OrganizationCustomersResponse,
} from "./accounting.types";
