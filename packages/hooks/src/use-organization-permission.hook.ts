import { useState, useEffect } from "react";
import { getAuthClient } from "./auth-client";

// Types mirroring the source project's PermissionCheckInput
type AgencyPermission = "create" | "update" | "delete" | "publish" | "payout-manage" | "sales-view" | "sales-export";
type ProjectPermission = "create" | "update" | "delete" | "archive" | "suspend" | "attribute";
type OrganizationPermission = "create" | "update" | "delete";
type MemberPermission = "create" | "update" | "delete";
type InvitationPermission = "create" | "cancel";

export interface PermissionCheckInput {
  agency?: AgencyPermission[];
  project?: ProjectPermission[];
  organization?: OrganizationPermission[];
  member?: MemberPermission[];
  invitation?: InvitationPermission[];
}

interface UseOrganizationPermissionOptions {
  permissions: PermissionCheckInput;
}

interface UseOrganizationPermissionResult {
  hasPermission: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Reusable hook to check organization permissions.
 * Calls getAuthClient().organization.hasPermission(...) directly.
 *
 * @example
 * ```tsx
 * const { hasPermission, isLoading } = useOrganizationPermission({
 *   permissions: { agency: ["payout-manage"] }
 * });
 *
 * if (isLoading) return <Spinner />;
 * if (!hasPermission) return <AccessDenied />;
 * ```
 */
export function useOrganizationPermission(
  options: UseOrganizationPermissionOptions,
): UseOrganizationPermissionResult {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAuthClient().organization.hasPermission({
        permissions: options.permissions,
      });

      const success = result?.data?.success ?? false;

      if (!success && result?.error) {
        const msg =
          typeof result.error === "string"
            ? result.error
            : (result.error as { message?: string }).message ?? "Permission check failed";
        setError(new Error(msg));
      }

      setHasPermission(success);
    } catch (err) {
      console.error("Organization permission check failed:", err);
      setError(
        err instanceof Error ? err : new Error("Permission check failed"),
      );
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const performCheck = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getAuthClient().organization.hasPermission({
          permissions: options.permissions,
        });

        const success = result?.data?.success ?? false;

        if (isMounted) {
          if (!success && result?.error) {
            const msg =
              typeof result.error === "string"
                ? result.error
                : (result.error as { message?: string }).message ?? "Permission check failed";
            setError(new Error(msg));
          }
          setHasPermission(success);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Organization permission check failed:", err);
          setError(
            err instanceof Error ? err : new Error("Permission check failed"),
          );
          setHasPermission(false);
          setIsLoading(false);
        }
      }
    };

    performCheck();

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(options.permissions)]);

  return {
    hasPermission,
    isLoading,
    error,
    refetch: checkPermission,
  };
}
