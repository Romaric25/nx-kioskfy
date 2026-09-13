import { createFileRoute } from "@tanstack/react-router";
import { PublishForm } from "@/components/labo/publish-form";

export const Route = createFileRoute("/organization/dashboard/publish")({
  component: PublishPage,
});

function PublishPage() {
  return (
    <div className="container py-8">
      <PublishForm />
    </div>
  );
}
