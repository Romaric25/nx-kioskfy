import { createFileRoute } from "@tanstack/react-router";
import { Cart } from "@/components/cart/cart";
import { Header } from "@/components/home/header";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <Cart />
      </main>
    </>
  );
}
