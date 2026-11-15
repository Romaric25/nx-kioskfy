import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@kioskfy/ui";
import { useActiveOrganization } from "@/hooks/use-organizations.hook";
import { useSession } from "@kioskfy/auth-client";
import { MembersManagement } from "@/components/labo/members-management";

export const Route = createFileRoute("/organization/dashboard/members")({
  component: MembersPage,
});

/** Gestion des collaborateurs et des rôles de l'agence (owner + admin). */
function MembersPage() {
  const { organization, isLoading } = useActiveOrganization();
  const { user } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Collaborateurs</h1>
        <p className="text-muted-foreground">
          Membres de votre agence, rôles et invitations
        </p>
      </div>

      {isLoading || !organization ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune agence sélectionnée.
          </CardContent>
        </Card>
      ) : (
        <MembersManagement
          organization={organization}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
}
