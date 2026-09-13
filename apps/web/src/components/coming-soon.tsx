import { Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
}

/** Placeholder page for routes that are not implemented yet. */
export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10">
        <Construction className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-muted-foreground">
          Cette page arrive bientôt sur kioskfy.
        </p>
      </div>
      <Link
        to="/"
        className="text-sm font-medium text-primary hover:underline underline-offset-4"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
