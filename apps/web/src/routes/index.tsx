import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/home/header";
import { Hero } from "@/components/home/hero";
import { CategoriesSection } from "@/components/home/categories-section";
import { CountryCarousel } from "@/components/home/country-carousel";
import { FeaturedNewspapers } from "@/components/home/featured-newspapers";
import { RecentMagazines } from "@/components/home/recent-magazines";
import { AgenciesCarrousel } from "@/components/home/agencies-carrousel";
import { Footer } from "@/components/home/footer";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <CategoriesSection />
      <CountryCarousel />
      <FeaturedNewspapers />
      <RecentMagazines />
      <AgenciesCarrousel />
      <Footer />
    </>
  );
}
