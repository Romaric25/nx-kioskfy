import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Newspaper,
  DollarSign,
  Settings,
  Eye,
  Plus,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from "@kioskfy/ui";
import { useSession, useSignOut } from "@kioskfy/auth-client";
import { useSelectedOrganization } from "@/lib/selected-organization-store";
import { Logo } from "@/components/ui/logo";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function LaboSidebar() {
  const { user } = useSession();
  const { signOut } = useSignOut();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { organizationId } = useSelectedOrganization();

  const navMain = [
    {
      title: "Tableau de bord",
      url: "/organization/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/organization/dashboard",
    },
    {
      title: "Vue d'ensemble",
      url: "/organization/dashboard/overview",
      icon: Eye,
      isActive: pathname.startsWith("/organization/dashboard/overview"),
    },
    {
      title: "Mes journaux",
      url: "/organization/dashboard/newspapers",
      icon: Newspaper,
      isActive: pathname.startsWith("/organization/dashboard/newspapers"),
    },
    {
      title: "Publier une édition",
      url: "/organization/dashboard/publish",
      icon: Plus,
      isActive: pathname.startsWith("/organization/dashboard/publish"),
    },
    {
      title: "Revenus",
      url: "/organization/dashboard/revenue",
      icon: DollarSign,
      isActive: pathname.startsWith("/organization/dashboard/revenue"),
    },
  ];

  const navSecondary = [
    {
      title: "Paramètres",
      url: "/organization/dashboard/settings",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/organization/login" });
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/organization/dashboard">
                <Logo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => {
                const isDisabled =
                  !organizationId && item.url !== "/organization/dashboard";
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      tooltip={item.title}
                      disabled={isDisabled}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Compte</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-1.5">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                aria-label="Déconnexion"
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
