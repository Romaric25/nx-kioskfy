import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@kioskfy/ui";
import {
  AlertCircle,
  Clock,
  Loader2,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  cancelOrganizationInvitation,
  getFullOrganization,
  inviteOrganizationMember,
  removeOrganizationMember,
  updateOrganizationMemberRole,
  ORGANIZATION_ROLES,
} from "@kioskfy/auth-client";
import type {
  OrganizationInvitation,
  OrganizationMember,
  OrganizationRole,
} from "@kioskfy/auth-client";
import type { OrganizationItem } from "@kioskfy/types";

const ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
  editor: "Éditeur",
};

function roleLabel(role: string): string {
  return ROLE_LABELS[role as OrganizationRole] ?? role;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Gestion des collaborateurs de l'agence (plugin organization de Better Auth) :
 * invitation par email + rôle, changement de rôle et retrait de membre,
 * annulation des invitations en attente.
 *
 * Garde-fous Better Auth (côté serveur) + garde-fous UI :
 * - impossible de retirer/rétrograder le dernier propriétaire ;
 * - un membre ne peut pas modifier/retirer son propre compte.
 */
export function MembersManagement({
  organization,
  currentUserId,
}: {
  organization: OrganizationItem;
  currentUserId?: string | null;
}) {
  const queryClient = useQueryClient();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationRole>("member");
  const [actionError, setActionError] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: ["org-members", organization.id],
    queryFn: () => getFullOrganization({ orgId: organization.id }),
    staleTime: 15_000,
  });

  const members = membersQuery.data?.members ?? [];
  const invitations = membersQuery.data?.invitations ?? [];
  const ownersCount = members.filter((m) => m.role === "owner").length;

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["org-members", organization.id],
    });

  const inviteMutation = useMutation({
    mutationFn: (input: { email: string; role: OrganizationRole }) =>
      inviteOrganizationMember({
        email: input.email,
        role: input.role,
        orgId: organization.id,
      }),
    onSuccess: () => {
      setInviteEmail("");
      setActionError(null);
      void invalidate();
    },
    onError: (err) => {
      setActionError(
        err instanceof Error ? err.message : "Impossible d'inviter ce membre",
      );
    },
  });

  const roleMutation = useMutation({
    mutationFn: (input: { memberId: string; role: OrganizationRole }) =>
      updateOrganizationMemberRole({
        memberId: input.memberId,
        role: input.role,
        orgId: organization.id,
      }),
    onSuccess: () => {
      setActionError(null);
      void invalidate();
    },
    onError: (err) => {
      setActionError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier le rôle",
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (member: OrganizationMember) =>
      removeOrganizationMember({
        memberIdOrEmail: member.user?.email ?? member.userId,
        orgId: organization.id,
      }),
    onSuccess: () => {
      setActionError(null);
      void invalidate();
    },
    onError: (err) => {
      setActionError(
        err instanceof Error ? err.message : "Impossible de retirer ce membre",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invitation: OrganizationInvitation) =>
      cancelOrganizationInvitation({ invitationId: invitation.id }),
    onSuccess: () => {
      setActionError(null);
      void invalidate();
    },
    onError: (err) => {
      setActionError(
        err instanceof Error ? err.message : "Impossible d'annuler l'invitation",
      );
    },
  });

  /** Un membre peut-il être retiré/rétrogradé ? */
  const canManageMember = (member: OrganizationMember): boolean => {
    if (member.userId === currentUserId) return false;
    if (member.role === "owner" && ownersCount <= 1) return false;
    return true;
  };

  const busy =
    inviteMutation.isPending ||
    roleMutation.isPending ||
    removeMutation.isPending ||
    cancelMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collaborateurs</CardTitle>
        <CardDescription>
          Invitez les membres de votre équipe et attribuez-leur un rôle.
          Les invitations expirent et doivent être acceptées par email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {actionError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* ── Invitation ─────────────────────────────────────────────── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const email = inviteEmail.trim();
            if (!email) return;
            inviteMutation.mutate({ email, role: inviteRole });
          }}
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <p className="mb-1.5 text-sm font-medium">Email du collaborateur</p>
            <Input
              type="email"
              placeholder="ex. redacteur@agence.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={busy}
              autoComplete="off"
            />
          </div>
          <div className="w-full sm:w-44">
            <p className="mb-1.5 text-sm font-medium">Rôle</p>
            <Select
              value={inviteRole}
              onValueChange={(value) =>
                setInviteRole(value as OrganizationRole)
              }
            >
              <SelectTrigger disabled={busy}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORGANIZATION_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={busy || !inviteEmail.trim()}
            className="sm:w-auto"
          >
            {inviteMutation.isPending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <UserPlus data-icon="inline-start" />
            )}
            Inviter
          </Button>
        </form>

        {/* ── Membres ────────────────────────────────────────────────── */}
        {membersQuery.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const editable = canManageMember(member);
              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage
                        src={member.user?.image ?? undefined}
                        alt={member.user?.name ?? member.user?.email ?? ""}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.user?.name ?? member.user?.email ?? "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {member.user?.name ?? "—"}
                        {member.userId === currentUserId && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            (vous)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.user?.email ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editable ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          roleMutation.mutate({
                            memberId: member.id,
                            role: value as OrganizationRole,
                          })
                        }
                      >
                        <SelectTrigger
                          className="h-8 w-40"
                          disabled={busy}
                          aria-label={`Rôle de ${member.user?.name ?? member.user?.email}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORGANIZATION_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">
                        {roleLabel(member.role)}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      disabled={busy || !editable}
                      onClick={() => removeMutation.mutate(member)}
                      aria-label={`Retirer ${member.user?.name ?? member.user?.email}`}
                      title={
                        editable
                          ? "Retirer ce membre"
                          : "Impossible : dernier propriétaire ou votre compte"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Invitations en attente ─────────────────────────────────── */}
        {invitations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Invitations en attente
            </p>
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-dashed p-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{invitation.email}</span>
                  <Badge variant="outline">
                    {roleLabel(invitation.role)}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground hover:text-destructive"
                  disabled={busy}
                  onClick={() => cancelMutation.mutate(invitation)}
                >
                  Annuler
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
