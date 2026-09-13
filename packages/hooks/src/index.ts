// @kioskfy/hooks — Shared React hooks
//
// Usage:
//   import { useAuth, useSocialAuth, authKeys } from '@kioskfy/hooks';
//   import { useAuth, useUser, useCreatePartnership } from '@kioskfy/hooks';

export { authKeys, useAuth, useSocialAuth } from "./use-auth.hook";

export {
  useUser,
  useAssignRole,
  useUserSessions,
  useRevokeUserSession,
  useConfirmEmail,
  useResendToken,
  useGeoIP,
} from "./use-users.hook";
export type { UserProfile, UserSession, GeoIPInfo } from "./use-users.hook";

export { useCreatePartnership } from "./use-partnership.hook";
export type { PartnershipRegisterUser } from "./use-partnership.hook";
