import * as React from "react";
import { Compass, ArrowLeft } from "lucide-react";

import { Button } from "./ui/button";
import { cn } from "../lib/utils";

export interface NotFoundPageProps {
  /** Lien du bouton principal (défaut : "/"). */
  homeHref?: string;
  /** Libellé du bouton principal. */
  homeLabel?: string;
  /** Titre affiché sous le "404". */
  title?: string;
  /** Description affichée sous le titre. */
  description?: string;
  /** Actions supplémentaires (rendues à côté du bouton principal). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Page 404 partagée par toutes les apps kioskfy.
 * Utilisée comme `defaultNotFoundComponent` du router TanStack.
 */
export function NotFoundPage({
  homeHref = "/",
  homeLabel = "Retour à l'accueil",
  title = "Page introuvable",
  description = "La page que vous recherchez n'existe pas ou a été déplacée.",
  children,
  className,
}: NotFoundPageProps) {
  return (
    <main
      className={cn(
        "relative flex min-h-[70vh] w-full flex-col items-center justify-center gap-6 overflow-hidden px-6 py-16 text-center",
        className,
      )}
    >
      {/* Halo et motif en pointillés en arrière-plan */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,var(--primary)_1px,transparent_0)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="flex flex-col items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Compass className="h-8 w-8 text-primary" aria-hidden />
        </div>

        <p className="bg-gradient-to-br from-primary to-emerald-900 bg-clip-text text-[7rem] font-black leading-none tracking-tight text-transparent sm:text-[9rem]">
          404
        </p>

        <div className="flex flex-col items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="max-w-md text-balance text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <a href={homeHref}>
            <ArrowLeft data-icon="inline-start" aria-hidden />
            {homeLabel}
          </a>
        </Button>
        {children}
      </div>
    </main>
  );
}
