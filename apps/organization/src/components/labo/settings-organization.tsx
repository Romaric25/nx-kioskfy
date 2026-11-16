import { useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  currencySymbol,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
} from "@kioskfy/ui";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe,
  ImagePlus,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { api, API_ORIGIN } from "@/lib/api";
import { useCountries } from "@/hooks/use-countries.hook";
import { useActiveOrganization } from "@/hooks/use-organizations.hook";
import {
  useOrganizationPermission,
  useSession,
} from "@kioskfy/auth-client";
import { MembersManagement } from "@/components/labo/members-management";
import {
  selectedOrganizationStore,
} from "@/lib/selected-organization-store";
import type { OrganizationItem } from "@kioskfy/types";
import type { OrganizationBalanceResponse } from "@kioskfy/types/accounting";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SettingsFormValues {
  name: string;
  email: string;
  country: string;
  address: string;
  phone: string;
  description: string;
  pispiAlias: string;
  newspaperPrice: string;
  logoFile: File | null;
}

type FormStatus = { type: "success" | "error"; message: string } | null;

/**
 * Paramètres de l'agence sélectionnée : modification des informations
 * (propriétaire uniquement) + suppression de l'agence.
 * Le logo est envoyé via l'upload présigné R2 puis référencé par
 * l'endpoint public `/api/uploads/stream/:key`.
 */
export function SettingsOrganization() {
  const { organization, isLoading } = useActiveOrganization();
  const { user } = useSession();

  // Rôles : seul l'owner peut modifier (organization:update) et supprimer
  // (organization:delete) — vérifiés via le plugin organization de Better
  // Auth (`POST /organization/has-permission`).
  const { hasPermission: canEdit, isLoading: isLoadingPermissions } =
    useOrganizationPermission({
      permissions: { organization: ["update"] },
      orgId: organization?.id,
    });
  const { hasPermission: canDelete } = useOrganizationPermission({
    permissions: { organization: ["delete"] },
    orgId: organization?.id,
  });
  // Gestion des collaborateurs : owner + admin (member:create/update/delete).
  const { hasPermission: canManageMembers } = useOrganizationPermission({
    permissions: {
      member: ["create", "update", "delete"],
    },
    orgId: organization?.id,
  });

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["org-balances", organization?.id],
    queryFn: () =>
      organization
        ? (api.organizations.getBalances(
            organization.id,
          ) as Promise<OrganizationBalanceResponse>)
        : null,
    enabled: !!organization,
  });

  if (isLoading || isLoadingPermissions || !organization) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
          Chargement des paramètres…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Informations de votre agence
        </p>
      </div>

      {canManageMembers && (
        <MembersManagement
          organization={organization}
          currentUserId={user?.id}
        />
      )}

      {canEdit ? (
        <>
          {/* Monté seulement quand l'organisation est chargée : les valeurs
              initiales du formulaire doivent refléter l'agence sélectionnée. */}
          <SettingsEditor
            key={organization.id}
            organization={organization}
            canDelete={canDelete}
          />

          <SoldeCard
            balance={balance}
            balanceLoading={balanceLoading}
          />
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {organization.name}
              </CardTitle>
              <CardDescription>
                <Badge variant="secondary" className="mt-1">
                  <Globe data-icon="inline-start" />
                  {organization.slug}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Seul le propriétaire de l'agence peut modifier ces
                informations.
              </div>
            </CardContent>
          </Card>

          <SoldeCard
            balance={balance}
            balanceLoading={balanceLoading}
          />
        </>
      )}
    </div>
  );
}

/** Carte solde partagée (visible par tous les membres). */
function SoldeCard({
  balance,
  balanceLoading,
}: {
  balance?: OrganizationBalanceResponse | null;
  balanceLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Solde</CardTitle>
        <CardDescription>Vos revenus disponibles</CardDescription>
      </CardHeader>
      <CardContent>
        {balanceLoading ? (
          <Skeleton className="h-8 w-40" />
        ) : (
          <div className="text-3xl font-bold">
            {(balance?.organizationAmount ?? 0).toLocaleString("fr-FR")}{" "}
            {currencySymbol(balance?.currency)}
          </div>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {balance?.totalSales ?? 0} vente
          {balance?.totalSales === 1 ? "" : "s"} au total
        </p>
      </CardContent>
    </Card>
  );
}

function SettingsEditor({
  organization,
  canDelete,
}: {
  organization: OrganizationItem;
  canDelete: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { countries, isLoadingCountries } = useCountries();

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<FormStatus>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suppression
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm({
    defaultValues: {
      name: organization.name,
      email: organization.email ?? "",
      country: organization.country,
      address: organization.address,
      phone: organization.phone,
      description: organization.description ?? "",
      pispiAlias: organization.pispiAlias ?? "",
      newspaperPrice:
        organization.newspaperPrice != null
          ? String(organization.newspaperPrice)
          : "",
      logoFile: null,
    } as SettingsFormValues,
    onSubmit: async ({ value }) => {
      setFormStatus(null);
      setIsSubmitting(true);
      try {
        // 1. Upload du nouveau logo (presigned R2) si un fichier est choisi.
        let logo: string | null = null;
        let logoUploadId: number | undefined;
        if (value.logoFile) {
          const file = value.logoFile;
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
          const { url, key } = await api.uploads.getPresignedUploadUrl(
            safeName,
            file.type || "application/octet-stream",
            "organizations",
          );
          const putResponse = await fetch(url, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type || "application/octet-stream" },
          });
          if (!putResponse.ok) {
            throw new Error("Échec de l'envoi du logo");
          }
          const upload = await api.uploads.confirmUpload({
            s3Key: key,
            filename: safeName,
          });
          logoUploadId = upload.id;
          logo = `${API_ORIGIN}/api/uploads/stream/${encodeURIComponent(key)}`;
        }

        // 2. Mise à jour de l'organisation (seuls les champs envoyés changent).
        await api.organizations.update(organization.id, {
          name: value.name,
          email: value.email,
          phone: value.phone,
          country: value.country,
          address: value.address,
          description: value.description,
          pispiAlias: value.pispiAlias.trim() || null,
          newspaperPrice:
            value.newspaperPrice.trim() === ""
              ? null
              : Number(value.newspaperPrice),
          ...(logo ? { logo, logoUploadId } : {}),
        });

        await queryClient.invalidateQueries({
          queryKey: ["organizations", "mine"],
        });
        setLogoPreview(null);
        setFormStatus({
          type: "success",
          message: "Agence mise à jour avec succès.",
        });
      } catch (err) {
        setFormStatus({
          type: "error",
          message:
            err instanceof Error && err.message
              ? err.message
              : "Erreur lors de la mise à jour de l'agence",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleLogoChange = (file: File | null) => {
    form.setFieldValue("logoFile", file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await api.organizations.delete(organization.id);
      selectedOrganizationStore.clear();
      await queryClient.invalidateQueries({
        queryKey: ["organizations", "mine"],
      });
      setDeleteOpen(false);
      navigate({ to: "/organization/dashboard" });
    } catch (err) {
      setDeleteError(
        err instanceof Error && err.message
          ? err.message
          : "Erreur lors de la suppression de l'agence",
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* ── Formulaire d'édition ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Modifier l'agence
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <Badge variant="secondary">
              <Globe data-icon="inline-start" />
              {organization.slug}
            </Badge>
            <span>Le slug (URL publique) n'est pas modifiable.</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {formStatus && (
              <div
                className={
                  formStatus.type === "success"
                    ? "flex items-start gap-2 rounded-md border border-emerald-600/20 bg-emerald-600/10 p-3 text-sm text-emerald-700 dark:text-emerald-400"
                    : "flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
                }
              >
                {formStatus.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{formStatus.message}</span>
              </div>
            )}

            <FieldGroup>
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Le nom de l'agence est requis" : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                    <FieldLabel htmlFor="settings-org-name">
                      Nom de l'agence *
                    </FieldLabel>
                    <Input
                      id="settings-org-name"
                      placeholder="Entrez le nom de l'agence"
                      disabled={isSubmitting}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((message) => ({ message }))}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="logoFile">
                {() => (
                  <Field>
                    <FieldLabel>Logo de l'agence</FieldLabel>
                    <div className="flex items-center gap-3">
                      {(logoPreview || organization.logo) && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          <img
                            src={logoPreview ?? organization.logo ?? ""}
                            alt="Aperçu du logo"
                            className="h-full w-full object-cover"
                          />
                          {logoPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                handleLogoChange(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = "";
                                }
                              }}
                              aria-label="Retirer le logo"
                              className="absolute -right-2 -top-2 rounded-full border-2 border-background bg-destructive text-white shadow-none"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSubmitting}
                        >
                          <ImagePlus data-icon="inline-start" />
                          {organization.logo || logoPreview
                            ? "Changer le logo"
                            : "Sélectionner un logo"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          PNG ou JPG, 20 Mo max.
                        </p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      aria-label="Logo de l'agence"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        handleLogoChange(file);
                      }}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="country"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Le pays est requis" : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                    <FieldLabel>Pays *</FieldLabel>
                    <Select
                      value={field.state.value || undefined}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger className="w-full" id="settings-org-country">
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCountries ? (
                          <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Chargement des pays...
                          </div>
                        ) : (
                          countries.map((country) => (
                            <SelectItem key={country.id} value={country.name}>
                              <span className="flex items-center gap-2">
                                <Image
                                  src={country.flag}
                                  alt=""
                                  width={20}
                                  height={20}
                                  className="shrink-0"
                                />
                                {country.name}
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={field.state.meta.errors.map((message) => ({ message }))}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return "L'email est requis";
                    if (!EMAIL_REGEX.test(value)) return "Adresse email invalide";
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                    <FieldLabel htmlFor="settings-org-email">Email *</FieldLabel>
                    <Input
                      id="settings-org-email"
                      type="email"
                      placeholder="Entrez l'email de l'agence"
                      autoComplete="email"
                      disabled={isSubmitting}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((message) => ({ message }))}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="phone"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Le téléphone est requis" : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                    <FieldLabel htmlFor="settings-org-phone">Téléphone *</FieldLabel>
                    <PhoneInput
                      id="settings-org-phone"
                      placeholder="Entrez votre numéro"
                      autoComplete="tel"
                      disabled={isSubmitting}
                      value={field.state.value}
                      onChange={(value) => field.handleChange(value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((message) => ({ message }))}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="address"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "L'adresse est requise" : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                    <FieldLabel htmlFor="settings-org-address">Adresse *</FieldLabel>
                    <Input
                      id="settings-org-address"
                      placeholder="Entrez l'adresse"
                      disabled={isSubmitting}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((message) => ({ message }))}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="pispiAlias">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="settings-org-pispi-alias">
                      Alias PI-SPI (BCEAO)
                    </FieldLabel>
                    <Input
                      id="settings-org-pispi-alias"
                      placeholder="ex. 8350050d-6f94-481c-8caa-2b59b1a3664e"
                      disabled={isSubmitting}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <p className="text-xs text-muted-foreground">
                      Alias SHID de votre compte PI-SPI : c'est vers ce compte
                      que vos gains seront reversés.
                    </p>
                  </Field>
                )}
              </form.Field>

              <form.Field name="newspaperPrice">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="settings-org-newspaper-price">
                      Prix fixe du journal (sans commission)
                    </FieldLabel>
                    <Input
                      id="settings-org-newspaper-price"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="ex. 250"
                      disabled={isSubmitting}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <p className="text-xs text-muted-foreground">
                      Montant net perçu par votre agence par exemplaire vendu,
                      hors commission kioskfy.
                    </p>
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="description"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "La description est requise" : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                    <FieldLabel htmlFor="settings-org-description">
                      Description *
                    </FieldLabel>
                    <Textarea
                      id="settings-org-description"
                      placeholder="Entrez une description de l'agence..."
                      rows={4}
                      disabled={isSubmitting}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((message) => ({ message }))}
                    />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Zone dangereuse (propriétaire uniquement) ──────────────────── */}
      {canDelete && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Zone dangereuse</CardTitle>
            <CardDescription>
              La suppression est définitive. Elle est refusée tant que l'agence
              possède des journaux ou des demandes de retrait.
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Dialog
            open={deleteOpen}
            onOpenChange={(open) => {
              setDeleteOpen(open);
              if (!open) {
                setDeleteConfirm("");
                setDeleteError(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 data-icon="inline-start" />
                Supprimer l'agence
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer cette agence ?</DialogTitle>
                <DialogDescription>
                  Tapez le nom de l'agence{" "}
                  <span className="font-medium text-foreground">
                    {organization.name}
                  </span>{" "}
                  pour confirmer. Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>

              {deleteError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={organization.name}
                disabled={isDeleting}
                autoComplete="off"
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isDeleting}>
                    Annuler
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  disabled={deleteConfirm !== organization.name || isDeleting}
                  onClick={() => void handleDelete()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    "Supprimer définitivement"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      )}
    </>
  );
}
