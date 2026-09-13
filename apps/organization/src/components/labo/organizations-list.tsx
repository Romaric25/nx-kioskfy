import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Building2, MapPin, Phone, Loader2 } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@kioskfy/ui";
import { useOrganizations } from "@/hooks/use-organizations.hook";
import { selectedOrganizationStore, useSelectedOrganization } from "@/lib/selected-organization-store";
import type { OrganizationItem } from "@kioskfy/types";

export function OrganizationsList() {
  const { organizations, isLoadingOrganizations } = useOrganizations();
  const { organizationId } = useSelectedOrganization();
  const navigate = useNavigate();
  const [isLoadingSelection, setIsLoadingSelection] = useState<string | null>(null);

  const selectOrganization = (org: OrganizationItem) => {
    setIsLoadingSelection(org.id);
    selectedOrganizationStore.setSelected(org.id, org.slug);
    // Small delay for the loading state, then navigate.
    setTimeout(() => {
      setIsLoadingSelection(null);
      navigate({ to: "/organization/dashboard/overview" });
    }, 150);
  };

  if (isLoadingOrganizations) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Mes agences</h2>
      </div>

      {organizations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Aucune agence</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Vous n&apos;avez pas encore d&apos;agence associée à votre compte.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((organization) => {
            const isActive = organizationId === organization.id;
            return (
              <Card
                key={organization.id}
                className={`overflow-hidden hover:shadow-lg transition-shadow ${
                  isActive ? "ring-2 ring-primary border-primary" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {organization.logo ? (
                      <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border bg-muted">
                        <Image
                          src={organization.logo}
                          alt={organization.name || "Organization"}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {organization.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {organization.slug}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm pt-0">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{organization.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="truncate">{organization.phone}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-3">
                  <Button
                    onClick={() => selectOrganization(organization)}
                    variant={isActive ? "default" : "outline"}
                    className="w-full"
                    disabled={isLoadingSelection === organization.id}
                  >
                    {isLoadingSelection === organization.id ? (
                      <>
                        <Loader2 data-icon="inline-start" className="animate-spin" />
                        Chargement...
                      </>
                    ) : isActive ? (
                      "Agence active"
                    ) : (
                      "Choisir cette agence"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
