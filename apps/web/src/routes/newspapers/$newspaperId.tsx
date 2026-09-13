import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/newspapers/$newspaperId")({
  component: NewspaperDetailLayout,
});

function NewspaperDetailLayout() {
  return <Outlet />;
}
