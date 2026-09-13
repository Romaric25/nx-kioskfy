// @kioskfy/stores — Shared Zustand stores
//
// Usage:
//   import { useCartStore }    from '@kioskfy/stores';
//   import { useErrorStore }   from '@kioskfy/stores';
//   import { useOrderStore }   from '@kioskfy/stores';
//

// ── Domain stores ────────────────────────────────────────────────────────

export { useCartStore } from "./cart.store";
export type { CartItem, CartState } from "./cart.store";

export { useOrderStore } from "./order.store";
export type { OrderState } from "./order.store";

export { useNewspaperStore } from "./newspaper.store";
export type { NewspaperState } from "./newspaper.store";

export { usePaymentStore } from "./payment.store";
export type { PaymentState } from "./payment.store";

export { usePayoutStore } from "./payout.store";
export type { PayoutState } from "./payout.store";

export { useOrganizationStore } from "./organization.store";
export type { OrganizationState } from "./organization.store";

// ── Utility stores ───────────────────────────────────────────────────────

export { useErrorStore } from "./error.store";
export type { ErrorMessage, ErrorType, ErrorState } from "./error.store";
