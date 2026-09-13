import { ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import {
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@kioskfy/ui";
import { cartStore, useCartStore } from "@/lib/cart-store";
import { priceFormatter } from "@/lib/price-formatter";

/**
 * Cart preview popover for the navbar. Built on DropdownMenu (the shared UI
 * package has no Popover primitive) — opens on click, lists the cart items
 * with a remove action and a checkout CTA.
 */
export function CartPopover() {
  const items = useCartStore();
  const cartCount = items.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full h-10 w-10 hover:bg-muted/50"
          aria-label={`Panier (${cartCount} article${cartCount > 1 ? "s" : ""})`}
          title="Panier"
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-[10px] border-2 border-background">
              {cartCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-0 shadow-xl border-border/60"
        align="end"
      >
        <div className="p-4 font-semibold border-b bg-muted/20 flex justify-between items-center">
          <span>Panier</span>
          <Badge variant="secondary" className="rounded-full">
            {cartCount} articles
          </Badge>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <div className="bg-muted p-4 rounded-full">
              <ShoppingCart className="h-8 w-8 opacity-40" />
            </div>
            <p className="text-sm">Votre panier est vide</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto p-4 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md border shadow-sm group-hover:scale-105 transition-transform">
                  <Image
                    src={item.coverImage}
                    alt={item.issueNumber}
                    width={56}
                    height={80}
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between py-0.5">
                  <div>
                    <h3 className="line-clamp-1 text-sm font-semibold">
                      {item.issueNumber}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.organization?.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">
                      {priceFormatter(item.price, item.country?.currency, "fr")}
                    </span>
                    <button
                      type="button"
                      onClick={() => cartStore.removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      aria-label={`Retirer ${item.issueNumber} du panier`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="p-4 border-t bg-muted/20 space-y-3">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-lg">
                {priceFormatter(
                  cartStore.total(),
                  items[0]?.country?.currency,
                  "fr",
                )}
              </span>
            </div>
            <Button
              className="w-full rounded-full shadow-lg shadow-primary/20"
              asChild
            >
              <Link to="/cart">Procéder au paiement</Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
