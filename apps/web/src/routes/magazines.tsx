import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/magazines")({
  component: MagazinesLayout,
});

function MagazinesLayout() {
  return <Outlet />;
}
