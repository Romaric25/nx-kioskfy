import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kioskfy/ui";
import { Construction, Sparkles, CheckCircle2 } from "lucide-react";

const DISMISSED_KEY = "kioskfy-construction-modal-dismissed";

const UPCOMING_FEATURES = [
  "Un catalogue complet de la presse africaine",
  "Compte lecteur avec favoris et historique",
  "Achat de numéros en ligne en toute simplicité",
];

/**
 * Modal affiché à l'ouverture du site pour avertir qu'il est en construction.
 * N'apparaît qu'une fois par session (sessionStorage).
 */
export function ConstructionModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Ne rien afficher côté serveur (SSR) — le modal s'ouvre après l'hydratation.
    if (typeof window === "undefined") return;
    try {
      if (!window.sessionStorage.getItem(DISMISSED_KEY)) {
        setOpen(true);
      }
    } catch {
      // sessionStorage indisponible (navigation privée) : on affiche quand même.
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // sessionStorage indisponible : on ignore, le modal se réaffichera.
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) dismiss();
      }}
    >
      <DialogContent className="overflow-hidden p-0 text-center sm:max-w-md">
        {/* Bandeau d'en-tête dégradé */}
        <div className="relative bg-gradient-to-br from-primary to-emerald-900 px-6 pb-8 pt-10">
          <div
            aria-hidden
            className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] [background-size:18px_18px]"
          />
          <div className="relative flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
              <Construction className="h-8 w-8 text-white" aria-hidden />
            </div>
            <DialogHeader className="gap-2.5">
              <div className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white ring-1 ring-white/30">
                <Sparkles className="h-3 w-3" aria-hidden />
                Bêta
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                Site en construction
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-white/85">
                Kioskfy est encore en cours de développement. Certaines
                fonctionnalités peuvent être incomplètes ou évoluer. Merci de
                votre compréhension !
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Corps du modal */}
        <div className="flex flex-col gap-5 px-6 pb-6 pt-5">
          <ul className="flex flex-col gap-2.5 text-left">
            {UPCOMING_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                {feature}
              </li>
            ))}
          </ul>
          <Button size="lg" className="w-full" onClick={dismiss}>
            Découvrir le site
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
