import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "./theme-provider";
import { Button } from "./components/ui/button";
import { cn } from "./lib/utils";

export function ThemeToggle({
  showLabel = true,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { showLabel?: boolean }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Default to light (Moon) until mounted to match the SSR output.
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      onClick={toggleTheme}
      className={cn(
        showLabel ? "w-full justify-start" : "size-9 rounded-full",
        className,
      )}
      aria-label="Basculer le thème"
      title="Basculer le thème"
      {...props}
    >
      {isDark ? (
        <Sun data-icon="inline-start" />
      ) : (
        <Moon data-icon="inline-start" />
      )}
      {showLabel && (isDark ? "Mode clair" : "Mode sombre")}
    </Button>
  );
}
