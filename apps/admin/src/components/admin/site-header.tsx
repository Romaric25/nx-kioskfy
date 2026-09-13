import { Separator, SidebarTrigger, ThemeToggle } from "@kioskfy/ui";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Tableau de bord",
  "/admin/newspapers": "Journaux",
  "/admin/orders": "Commandes",
  "/admin/organizations": "Organisations",
  "/admin/users": "Utilisateurs",
  "/admin/withdrawals": "Retraits",
  "/admin/settings": "Paramètres",
};

function currentTitle(): string {
  if (typeof window === "undefined") return "Tableau de bord";
  const path = window.location.pathname;
  return PAGE_TITLES[path] ?? "Tableau de bord";
}

export function SiteHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{currentTitle()}</h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
