import { Search } from "lucide-react";
import { Input, cn } from "@kioskfy/ui";

import { useRouter, useLocation, useSearch } from "@tanstack/react-router";
import { useRef, useTransition } from "react";

interface SearchBarProps {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}

export function SearchBar({
  className,
  inputClassName,
  placeholder = "Rechercher un journal...",
}: SearchBarProps) {
  const pathname = useLocation().pathname;
  const router = useRouter();
  const searchParams = useSearch({ strict: false }) as Record<
    string,
    string | undefined
  >;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();
  const paths = ["/newspapers", "/magazines", "/categories", "/countries"];

  const shouldShow = paths.some((path) => pathname?.startsWith(path));

  const handleSearch = (term: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      startTransition(() => {
        router.navigate({
          to: pathname,
          search: term ? ({ q: term } as never) : ({} as never),
          replace: true,
        });
      });
    }, 300);
  };

  if (!shouldShow) return null;

  return (
    <div className={cn("relative group mt-4", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
      <Input
        type="search"
        placeholder={placeholder}
        defaultValue={searchParams["q"]?.toString()}
        onChange={(e) => handleSearch(e.target.value)}
        className={cn(
          "h-10 rounded-full border-muted-foreground/20 bg-muted/20 pl-10 text-sm shadow-none focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary transition-all duration-300",
          inputClassName,
        )}
      />
    </div>
  );
}
