import { Outlet, Navigate, createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@kioskfy/ui";
import { useSession, isAdminRole } from "@kioskfy/auth-client";
import { AppSidebar } from "../components/admin/app-sidebar";
import { SiteHeader } from "../components/admin/site-header";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, isLoading } = useSession();

  // While the session loads, render a neutral loading screen (also used during SSR).
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only system roles admin / superadmin can access the admin panel.
  if (!user || !isAdminRole(user)) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:p-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
