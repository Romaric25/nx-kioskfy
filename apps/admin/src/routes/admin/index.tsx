import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { ChartAreaInteractive } from "../../components/admin/chart-area-interactive";
import { SectionCards } from "../../components/admin/section-cards";
import { RecentOrders } from "../../components/admin/recent-orders";
import { useAdminStats } from "../../hooks/use-admin-stats";

export const Route = createFileRoute("/admin/")({ component: DashboardPage });

function DashboardPage() {
  const { stats, loading, error } = useAdminStats();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {error && (
        <div className="mx-4 flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive lg:mx-6">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}
      <SectionCards stats={stats} loading={loading} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive series={stats?.salesSeries ?? []} loading={loading} />
      </div>
      <RecentOrders />
    </div>
  );
}
