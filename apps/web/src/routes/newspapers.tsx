import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/newspapers")({
  component: NewspapersLayout,
});

function NewspapersLayout() {
  return <Outlet />;
}
