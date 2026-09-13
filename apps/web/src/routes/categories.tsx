import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/home/header";
import { Footer } from "@/components/home/footer";

export const Route = createFileRoute("/categories")({
  component: CategoriesLayout,
});

function CategoriesLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
