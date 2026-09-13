import { createFileRoute } from "@tanstack/react-router";
import { AccountingManagement } from "@/components/labo/accounting-management";
import { useActiveOrganization } from "@/hooks/use-organizations.hook";

export const Route = createFileRoute("/organization/dashboard/revenue")({
  component: RevenuePage,
});

function RevenuePage() {
  const { organization, isLoading } = useActiveOrganization();

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Chargement...</div>;
  }

  if (!organization) {
    return <div className="py-12 text-center">Aucune organisation active.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Revenus et Comptabilité
        </h1>
        <p className="text-muted-foreground">
          Gérez vos revenus et suivez vos retraits.
        </p>
      </div>

      <AccountingManagement organizationId={organization.id} />
    </div>
  );
}
