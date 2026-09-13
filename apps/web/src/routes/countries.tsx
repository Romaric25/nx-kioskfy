import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/home/header";
import { Footer } from "@/components/home/footer";

export const Route = createFileRoute("/countries")({
  component: CountriesLayout,
});

function CountriesLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
