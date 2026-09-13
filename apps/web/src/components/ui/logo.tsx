import { Newspaper } from "lucide-react";

interface LogoProps {
  className?: string;
}

/** Kioskfy brand logo (text-based). */
export function Logo({ className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Newspaper className="size-4" />
      </span>
      <span className="text-xl font-extrabold tracking-tight text-foreground">
        kioskfy
      </span>
    </span>
  );
}
