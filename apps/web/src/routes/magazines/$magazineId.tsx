import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/magazines/$magazineId")({
  component: MagazineDetailLayout,
});

function MagazineDetailLayout() {
  return <Outlet />;
}
