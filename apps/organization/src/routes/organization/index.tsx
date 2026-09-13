import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/organization/")({
  loader: () => {
    throw redirect({ to: "/organization/login" });
  },
});
