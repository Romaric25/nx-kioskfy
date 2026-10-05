import { useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "@unpic/react";
import {
  Button,
  Input,
  PhoneInput,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@kioskfy/ui";
import {
  AlertCircle,
  ImagePlus,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { useSession } from "@kioskfy/auth-client";
import { api, API_ORIGIN } from "@/lib/api";
import { useCountries } from "@/hooks/use-countries.hook";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface OrganizationFormValues {
  name: string;
  email: string;
  country: string;
  address: string;
  phone: string;
  description: string;
  logoFile: File | null;
}

/**
 * Formulaire de création d'agence (portail partenaire).
 * Le logo est envoyé via l'upload présigné R2 puis référencé par
 * l'endpoint public `/api/uploads/stream/:key`.
 */
export function OrganizationForm() {
  const [open, setOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { countries, isLoadingCountries } = useCountries();
  const { user } = useSession();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      name: "",
      email: user?.email ?? "",
      country: "",
      address: "",
      phone: "",
      description: "",
      logoFile: null,
    } as OrganizationFormValues,
    onSubmit: async ({ value }) => {
      setFormError(null);
      setIsSubmitting(true);
      try {
        // 1. Upload du logo (presigned R2) si un fichier est sélectionné.
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

        // 2. Création de l'organisation (l'API génère le slug).
        await api.organizations.create({
          name: value.name,
          email: value.email,
          phone: value.phone,
          country: value.country,
          address: value.address,
          description: value.description,
          logo,
          logoUploadId,
          metadata: JSON.stringify({
            isActive: true,
            allowComments: false,
            publishAuto: false,
          }),
        });

        queryClient.invalidateQueries({ queryKey: ["organizations", "mine"] });
        setOpen(false);
        setLogoPreview(null);
        form.reset();
      } catch (err) {
        setFormError(
          err instanceof Error && err.message
            ? err.message
            : "Erreur lors de la création de l'organisation",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleLogoChange = (file: File | null) => {
    form.setFieldValue("logoFile", file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Créer une organisation
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Créer une organisation</SheetTitle>
          <SheetDescription>
            Remplissez les informations ci-dessous pour créer votre nouvelle
            agence.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="flex-1 space-y-4 py-4 pr-2">
            {formError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
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
                    <FieldLabel htmlFor="org-name">Nom de l'agence *</FieldLabel>
                    <Input
                      id="org-name"
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
                      {logoPreview ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          <img
                            src={logoPreview}
                            alt="Aperçu du logo"
                            className="h-full w-full object-cover"
                          />
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
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-muted-foreground">
                          <ImagePlus className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {logoPreview ? "Changer le logo" : "Sélectionner un logo"}
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
                      <SelectTrigger className="w-full" id="org-country">
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
                    <FieldLabel htmlFor="org-email">Email *</FieldLabel>
                    <Input
                      id="org-email"
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
                name="address"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "L'adresse est requise" : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                    <FieldLabel htmlFor="org-address">Adresse *</FieldLabel>
                    <Input
                      id="org-address"
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

              <form.Field
                name="phone"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Le téléphone est requis" : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                    <FieldLabel htmlFor="org-phone">Téléphone *</FieldLabel>
                    <PhoneInput
                      id="org-phone"
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
                name="description"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "La description est requise" : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                    <FieldLabel htmlFor="org-description">Description *</FieldLabel>
                    <Textarea
                      id="org-description"
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
          </div>

          <div className="border-t bg-background p-4">
            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([submitting]) => (
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || submitting}
                >
                  {isSubmitting || submitting ? (
                    <>
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    "Créer l'organisation"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
