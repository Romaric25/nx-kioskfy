import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  LayoutDashboard,
  Newspaper,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@kioskfy/ui";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const data = {
  navMain: [
    { title: "Tableau de bord", url: "/admin", icon: LayoutDashboard },
    { title: "Journaux", url: "/admin/newspapers", icon: Newspaper },
    { title: "Commandes", url: "/admin/orders", icon: ShoppingBag },
    { title: "Organisations", url: "/admin/organizations", icon: Building2 },
    { title: "Utilisateurs", url: "/admin/users", icon: Users },
    { title: "Retraits", url: "/admin/withdrawals", icon: Wallet },
    { title: "Paramètres", url: "/admin/settings", icon: Settings },
  ] as { title: string; url: string; icon: LucideIcon }[],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Kioskfy">
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Newspaper className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Kioskfy</span>
                  <span className="truncate text-xs text-muted-foreground">Admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
