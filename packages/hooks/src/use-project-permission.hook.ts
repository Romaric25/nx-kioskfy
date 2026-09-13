import { useState, useEffect } from "react";
import { getAuthClient } from "./auth-client";

type ProjectPermission = "create" | "update" | "delete" | "archive" | "suspend" | "attribute";

export interface ProjectPermissionCheckInput {
  project?: ProjectPermission[];
}

interface UseProjectPermissionOptions {
  permissions: ProjectPermissionCheckInput;
}

interface UseProjectPermissionResult {
  hasPermission: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Reusable hook to check project-level permissions.
 * Calls getAuthClient().admin.hasPermission(...) directly.
 *
 * @example
 * ```tsx
 * const { hasPermission, isLoading } = useProjectPermission({
 *   permissions: { project: ["archive"] }
 * });
 *
 * if (isLoading) return <Spinner />;
 * if (!hasPermission) return <AccessDenied />;
 * ```
 */
export function useProjectPermission(
  options: UseProjectPermissionOptions,
): UseProjectPermissionResult {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert to Record<string, string[]> for admin.hasPermission
      const permissionsRecord: Record<string, string[]> = {};
      if (options.permissions.project) {
        permissionsRecord.project = options.permissions.project;
      }

      const result = await getAuthClient().admin.hasPermission({
        permissions: permissionsRecord,
      });

      const success = result?.data?.success ?? false;

      if (!success && result?.error) {
        const msg =
          typeof result.error === "string"
            ? result.error
            : (result.error as { message?: string }).message ?? "Project permission check failed";
        setError(new Error(msg));
      }

      setHasPermission(success);
    } catch (err) {
      console.error("Project permission check failed:", err);
      setError(
        err instanceof Error ? err : new Error("Project permission check failed"),
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
        // Convert to Record<string, string[]> for admin.hasPermission
        const permissionsRecord: Record<string, string[]> = {};
        if (options.permissions.project) {
          permissionsRecord.project = options.permissions.project;
        }

        const result = await getAuthClient().admin.hasPermission({
          permissions: permissionsRecord,
        });

        const success = result?.data?.success ?? false;

        if (isMounted) {
          if (!success && result?.error) {
            const msg =
              typeof result.error === "string"
                ? result.error
                : (result.error as { message?: string }).message ?? "Project permission check failed";
            setError(new Error(msg));
          }
          setHasPermission(success);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Project permission check failed:", err);
          setError(
            err instanceof Error ? err : new Error("Project permission check failed"),
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
