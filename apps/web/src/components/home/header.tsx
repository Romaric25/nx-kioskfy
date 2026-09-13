import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Newspaper,
  BookOpen,
  Handshake,
  Menu,
  User,
  ChevronRight,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetTitle,
  ThemeToggle,
} from "@kioskfy/ui";
import { initAuth, useSession, useSignOut } from "@kioskfy/auth-client";
import { API_ORIGIN } from "@/lib/api";
import { Logo } from "@/components/ui/logo";
import { useCartStore } from "@/lib/cart-store";
import { CartPopover } from "@/components/cart/cart-popover";

// Initialize the auth client once (client-side only).
if (typeof window !== "undefined") {
  initAuth({ baseURL: API_ORIGIN, basePath: "/api/auth" });
}

/** "Romaric Kone" → "RK" ; "Romaric" → "RO". */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Header() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartItems = useCartStore();
  const cartCount = cartItems.length;
  const { user } = useSession();
  const { signOut } = useSignOut();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-primary bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 md:h-20 items-center justify-between gap-4">
            {/* Logo area */}
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-2 group relative z-10"
              >
                <Logo />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 p-1 bg-muted/30 rounded-full border border-border/40 backdrop-blur-sm">
              <Button
                variant={
                  pathname?.startsWith("/newspapers") ? "secondary" : "ghost"
                }
                className={`rounded-full gap-2 h-9 px-4 shadow-none transition-all ${
                  pathname?.startsWith("/newspapers")
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                }`}
                asChild
              >
                <Link to="/newspapers">
                  <Newspaper className="h-4 w-4" />
                  Journaux
                </Link>
              </Button>
              <Button
                variant={
                  pathname?.startsWith("/magazines") ? "secondary" : "ghost"
                }
                className={`rounded-full gap-2 h-9 px-4 shadow-none transition-all ${
                  pathname?.startsWith("/magazines")
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                }`}
                asChild
              >
                <Link to="/magazines">
                  <BookOpen className="h-4 w-4" />
                  Magazines
                </Link>
              </Button>
            </nav>

            {/* Actions area */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Partner Button - Premium Gold Style */}
              <Button
                variant="outline"
                size="sm"
                className="hidden xl:flex items-center gap-2 rounded-full border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent hover:from-amber-500/20 hover:to-amber-500/5 hover:border-amber-500/50 text-foreground transition-all duration-300 shadow-sm hover:shadow-amber-500/20 hover:scale-105 h-9"
                asChild
              >
                <Link to="/partnership">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors mr-1.5">
                    <Handshake className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                    Devenir partenaire
                  </span>
                </Link>
              </Button>

              <div className="flex items-center gap-1 border-l pl-2 ml-2 border-border/50">
                <CartPopover />
                <ThemeToggle showLabel={false} className="size-10 hover:bg-muted/50" />
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-10 w-10 p-0 hover:bg-muted/50"
                        aria-label="Mon compte"
                        title={user.name}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image ?? undefined} alt={user.name} />
                          <AvatarFallback className="text-xs font-semibold">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="mt-1 truncate text-xs leading-tight text-muted-foreground">
                          {user.email}
                        </p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-pointer gap-2">
                        <Link to="/dashboard">
                          <LayoutDashboard className="h-4 w-4" />
                          Tableau de bord
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-10 w-10 hover:bg-muted/50"
                    aria-label="Se connecter"
                    title="Se connecter"
                    asChild
                  >
                    <Link to="/login">
                      <User className="h-5 w-5" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full ml-auto"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          side="right"
          className="p-0 border-l border-border/40 bg-background/95 backdrop-blur-xl w-[320px] sm:w-[380px]"
        >
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header with Logo */}
            <div className="p-6 pb-2">
              <div className="flex items-center justify-between mb-8">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <Logo />
                </Link>
              </div>
            </div>

            <div className="flex-1 px-6 overflow-y-auto">
              <div className="space-y-6 py-2">
                {/* Main Navigation */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3 px-2 uppercase tracking-wider">
                    Explorer
                  </h4>

                  <Link
                    to="/newspapers"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/60 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Newspaper className="h-4 w-4" />
                      </div>
                      <span className="font-medium">Journaux</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                  </Link>

                  <Link
                    to="/magazines"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/60 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <span className="font-medium">Magazines</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                  </Link>
                </div>

                {/* Account */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3 px-2 uppercase tracking-wider">
                    Mon Compte
                  </h4>

                  <Link
                    to="/cart"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/60 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <span className="font-medium">Panier</span>
                      {cartCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                  </Link>

                  {user ? (
                    <div className="px-2 space-y-3">
                      <div className="flex items-center gap-3 p-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image ?? undefined} alt={user.name} />
                          <AvatarFallback className="text-sm font-semibold">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{user.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full rounded-full shadow-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                        asChild
                      >
                        <Link to="/dashboard">
                          <LayoutDashboard data-icon="inline-start" />
                          Tableau de bord
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full rounded-full"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleSignOut();
                        }}
                      >
                        <LogOut data-icon="inline-start" />
                        Déconnexion
                      </Button>
                    </div>
                  ) : (
                    <div className="px-2">
                      <Button
                        className="w-full rounded-full shadow-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                        asChild
                      >
                        <Link to="/login">Se connecter</Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Partnership */}
                <div className="pt-2">
                  <Link
                    to="/partnership"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block group"
                  >
                    <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/10 p-4 transition-all hover:border-amber-500/40 hover:shadow-md hover:shadow-amber-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Handshake className="h-4 w-4" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                        Devenir partenaire
                      </h4>
                      <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                        Rejoignez notre réseau de distribution et développez
                        votre audience.
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t border-border/40 bg-muted/20 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Thème</span>
                <ThemeToggle showLabel={false} />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
