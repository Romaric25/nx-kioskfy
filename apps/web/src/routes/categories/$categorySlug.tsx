import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/categories/$categorySlug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { categorySlug } = Route.useParams();
  return <ComingSoon title={`Catégorie ${categorySlug}`} />;
}
