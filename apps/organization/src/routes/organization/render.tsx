import { createFileRoute } from "@tanstack/react-router";
import { NewspaperPdfViewer } from "@/components/view-newspaper-pdf";
import { AgencyGuard } from "@/components/labo/agency-guard";

export const Route = createFileRoute("/organization/render")({
  component: RenderPage,
  head: () => ({
    meta: [
      { title: "Visualisation du journal | kioskfy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function RenderPage() {
  return (
    <AgencyGuard>
      <div className="flex-1 space-y-4">
        <NewspaperPdfViewer back="/organization/dashboard/newspapers" />
      </div>
    </AgencyGuard>
  );
}
