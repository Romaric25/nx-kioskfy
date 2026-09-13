import { createFileRoute } from "@tanstack/react-router";
import { ChartAreaInteractive } from "../../components/admin/chart-area-interactive";
import { SectionCards } from "../../components/admin/section-cards";
import { RecentOrders } from "../../components/admin/recent-orders";

export const Route = createFileRoute("/admin/")({ component: DashboardPage });

function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <RecentOrders />
    </div>
  );
}
