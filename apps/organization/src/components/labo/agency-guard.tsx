import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSession, initAuth, isAgencyUser } from "@kioskfy/auth-client";
import { API_ORIGIN } from "@/lib/api";
import { Loader2 } from "lucide-react";

// Initialize the auth client once (client-side only).
if (typeof window !== "undefined") {
  initAuth({ baseURL: API_ORIGIN, basePath: "/api/auth" });
}

/**
 * Protects the agency dashboard. Only users with typeUser === "agency"
 * can access it — others are redirected to /organization/login.
 */
export function AgencyGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, isLoading } = useSession();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    setHasChecked(true);
    if (!user || !isAgencyUser(user)) {
      navigate({ to: "/organization/login", replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !hasChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAgencyUser(user)) {
    return null;
  }

  return <>{children}</>;
}
