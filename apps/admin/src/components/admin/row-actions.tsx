import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@kioskfy/ui";
import { cn } from "@kioskfy/ui";

export interface RowAction {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  /** Renders the item with a destructive style. */
  destructive?: boolean;
  disabled?: boolean;
  /** Items marked hidden are filtered out of the menu. */
  hidden?: boolean;
}

/**
 * Per-row actions menu (⋮) rendered in an "Actions" table column.
 */
export function RowActions({ actions, label = "Actions" }: { actions: RowAction[]; label?: string }) {
  const visible = actions.filter((action) => !action.hidden);
  if (visible.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={label}>
          <MoreHorizontal data-icon="inline-start" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>
        {visible.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.label}
              disabled={action.disabled}
              onSelect={(event) => {
                event.preventDefault();
                action.onClick?.();
              }}
              className={cn(action.destructive && "text-destructive focus:text-destructive")}
            >
              {Icon && <Icon data-icon="inline-start" />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
