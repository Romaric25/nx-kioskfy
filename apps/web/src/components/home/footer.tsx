import { Link } from "@tanstack/react-router";
import { Facebook, Twitter, Instagram, Linkedin, Heart } from "lucide-react";
import { Button, Input } from "@kioskfy/ui";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-muted/30 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          {/* Brand & Social */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link to="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              La première plateforme de distribution de presse numérique en
              Afrique. Accédez à vos journaux et magazines préférés partout,
              tout le temps.
            </p>
            <div className="flex gap-4">
              <Link
                to="/"
                className="h-10 w-10 rounded-full border border-border/50 bg-background flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:shadow-sm transition-all duration-300"
              >
                <Facebook className="h-4 w-4" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                to="/"
                className="h-10 w-10 rounded-full border border-border/50 bg-background flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:shadow-sm transition-all duration-300"
              >
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                to="/"
                className="h-10 w-10 rounded-full border border-border/50 bg-background flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:shadow-sm transition-all duration-300"
              >
                <Instagram className="h-4 w-4" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link
                to="/"
                className="h-10 w-10 rounded-full border border-border/50 bg-background flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:shadow-sm transition-all duration-300"
              >
                <Linkedin className="h-4 w-4" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold tracking-tight uppercase text-foreground/80">
              Navigation
            </h3>
            <nav className="flex flex-col gap-3 text-sm text-muted-foreground">
              <Link
                to="/newspapers"
                className="hover:text-primary transition-colors hover:translate-x-1 duration-200"
              >
                Journaux
              </Link>
              <Link
                to="/magazines"
                className="hover:text-primary transition-colors hover:translate-x-1 duration-200"
              >
                Magazines
              </Link>
              <Link
                to="/agencies"
                className="hover:text-primary transition-colors hover:translate-x-1 duration-200"
              >
                Agences
              </Link>
            </nav>
          </div>

          {/* Links Column 2 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold tracking-tight uppercase text-foreground/80">
              Aide & Support
            </h3>
            <nav className="flex flex-col gap-3 text-sm text-muted-foreground">
              <Link
                to="/faq"
                className="hover:text-primary transition-colors hover:translate-x-1 duration-200"
              >
                FAQ
              </Link>
              <Link
                to="/contact"
                className="hover:text-primary transition-colors hover:translate-x-1 duration-200"
              >
                Nous contacter
              </Link>
              <Link
                to="/cgv"
                className="hover:text-primary transition-colors hover:translate-x-1 duration-200"
              >
                CGV
              </Link>
              <Link
                to="/confidentialite"
                className="hover:text-primary transition-colors hover:translate-x-1 duration-200"
              >
                Politique de confidentialité
              </Link>
            </nav>
          </div>

          {/* Newsletter / Apps */}
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-tight uppercase text-foreground/80">
                Newsletter
              </h3>
              <p className="text-sm text-muted-foreground text-pretty max-w-xs">
                Inscrivez-vous pour recevoir les dernières actualités et offres
                exclusives.
              </p>
              <form
                className="flex gap-2 max-w-sm"
                onSubmit={(e) => e.preventDefault()}
              >
                <Input
                  type="email"
                  placeholder="Votre email"
                  className="h-10 bg-background border-border/60 focus-visible:ring-primary/20"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-10 px-4 bg-foreground text-background hover:bg-foreground/90"
                >
                  OK
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {currentYear} Kioskfy Inc. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <Link to="/confidentialite" className="hover:text-primary transition-colors">
              Politique de confidentialité
            </Link>
            <Link to="/cgv" className="hover:text-primary transition-colors">
              Conditions d'utilisation
            </Link>
          </div>
          <p className="flex items-center gap-1">
            Fait avec ❤️ en Afrique{" "}
            <Heart className="h-3 w-3 text-red-500 fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
}
