import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Switch,
} from "@kioskfy/ui";
import { FileText, FileUp, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { api, API_ORIGIN } from "@/lib/api";
import { useActiveOrganization } from "@/hooks/use-organizations.hook";

interface PublishFormValues {
  issueNumber: string;
  publishDate: string;
  price: number;
  autoPublish: boolean;
  coverImageFile: File | null;
  pdfFile: File | null;
}

/** Publish a new edition for the selected agency. */
export function PublishForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization, isLoading: isLoadingOrganization } =
    useActiveOrganization();
  const [formError, setFormError] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  /** Envoie un fichier via l'upload présigné R2 et retourne son upload ID. */
  const uploadFile = async (file: File, folder: string) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const { url, key } = await api.uploads.getPresignedUploadUrl(
      safeName,
      file.type || "application/octet-stream",
      folder,
    );
    const putResponse = await fetch(url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });
    if (!putResponse.ok) {
      throw new Error("Échec de l'envoi du fichier");
    }
    const upload = await api.uploads.confirmUpload({
      s3Key: key,
      filename: safeName,
    });
    return { uploadId: upload.id, streamUrl: `${API_ORIGIN}/api/uploads/stream/${encodeURIComponent(key)}` };
  };

  const createNewspaper = useMutation({
    mutationFn: (payload: Parameters<typeof api.newspapers.create>[0]) =>
      api.newspapers.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labo-newspapers"] });
      navigate({ to: "/organization/dashboard/newspapers" });
    },
    onError: (err) => {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : "Erreur lors de la publication",
      );
    },
  });

  const form = useForm({
    defaultValues: {
      issueNumber: "",
      publishDate: new Date().toISOString().slice(0, 10),
      price: 0,
      autoPublish: false,
      coverImageFile: null,
      pdfFile: null,
    } as PublishFormValues,
    onSubmit: async ({ value }) => {
      if (!organization) return;
      setFormError(null);
      await createNewspaper.mutateAsync({
        issueNumber: value.issueNumber,
        publishDate: new Date(value.publishDate).toISOString(),
        price: Number(value.price),
        status: "draft",
        organizationId: organization.id,
        country: "",
        autoPublish: value.autoPublish,
        coverImageUploadId: value.coverImageFile
          ? (await uploadFile(value.coverImageFile, "newspapers/covers")).uploadId
          : undefined,
        pdfUploadId: value.pdfFile
          ? (await uploadFile(value.pdfFile, "newspapers")).uploadId
          : undefined,
      });
    },
  });

  // Prefill the price with the organization's configured price.
  useEffect(() => {
    if (organization) {
      form.setFieldValue("price", 0);
    }
  }, [organization, form]);

  if (isLoadingOrganization) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-12 text-center text-muted-foreground">
          Chargement...
        </CardContent>
      </Card>
    );
  }

  if (!organization) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Aucune agence sélectionnée</CardTitle>
          <CardDescription>
            Sélectionnez une agence depuis le tableau de bord avant de publier
            une édition.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Publier une édition
        </CardTitle>
        <CardDescription>
          Remplissez les informations pour publier une nouvelle édition de{" "}
          {organization.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {formError && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          )}

          <FieldGroup>
            <form.Field
              name="issueNumber"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Le numéro d'édition est requis" : undefined,
              }}
            >
              {(field) => (
                <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                  <FieldLabel htmlFor="publish-issue">Numéro d'édition</FieldLabel>
                  <Input
                    id="publish-issue"
                    placeholder="Ex : N°1234"
                    disabled={createNewspaper.isPending}
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
              name="publishDate"
              validators={{
                onChange: ({ value }) =>
                  !value ? "La date est requise" : undefined,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="publish-date">
                    Date de publication
                  </FieldLabel>
                  <Input
                    id="publish-date"
                    type="date"
                    disabled={createNewspaper.isPending}
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

            <form.Field name="coverImageFile">
              {(field) => (
                <Field>
                  <FieldLabel>Image de couverture</FieldLabel>
                  {coverPreview ? (
                    <div className="flex items-center gap-3 rounded-md border p-3">
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                        <img
                          src={coverPreview}
                          alt="Aperçu de la couverture"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {field.state.value?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(field.state.value?.size ?? 0) / (1024 * 1024) > 0
                            ? `${((field.state.value?.size ?? 0) / (1024 * 1024)).toFixed(2)} Mo`
                            : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Retirer la couverture"
                        disabled={createNewspaper.isPending}
                        onClick={() => {
                          field.handleChange(null);
                          setCoverPreview(null);
                          if (coverInputRef.current) coverInputRef.current.value = "";
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={createNewspaper.isPending}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/30 px-4 py-8 text-center transition-colors hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Cliquez pour sélectionner une couverture
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PNG ou JPG, 15 Mo maximum
                      </span>
                    </button>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label="Image de couverture de l'édition"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (file && file.size > 15 * 1024 * 1024) {
                        setFormError("L'image ne doit pas dépasser 15 Mo");
                        e.target.value = "";
                        return;
                      }
                      field.handleChange(file);
                      setCoverPreview(file ? URL.createObjectURL(file) : null);
                    }}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field
              name="pdfFile"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Le fichier PDF est requis" : undefined,
              }}
            >
              {(field) => (
                <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                  <FieldLabel>Fichier PDF *</FieldLabel>
                  {field.state.value ? (
                    <div className="flex items-center gap-3 rounded-md border p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {field.state.value.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(field.state.value.size / (1024 * 1024)).toFixed(2)} Mo
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Retirer le PDF"
                        disabled={createNewspaper.isPending}
                        onClick={() => {
                          field.handleChange(null);
                          if (pdfInputRef.current) pdfInputRef.current.value = "";
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={createNewspaper.isPending}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/30 px-4 py-8 text-center transition-colors hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FileUp className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Cliquez pour sélectionner le PDF
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PDF, 250 Mo maximum
                      </span>
                    </button>
                  )}
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    aria-label="Fichier PDF de l'édition"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (file && file.size > 250 * 1024 * 1024) {
                        setFormError("Le PDF ne doit pas dépasser 250 Mo");
                        e.target.value = "";
                        return;
                      }
                      field.handleChange(file);
                    }}
                  />
                  <FieldError
                    errors={field.state.meta.errors.map((message) => ({ message }))}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field
              name="price"
              validators={{
                onChange: ({ value }) =>
                  value <= 0 ? "Le prix doit être supérieur à 0" : undefined,
              }}
            >
              {(field) => (
                <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                  <FieldLabel htmlFor="publish-price">Prix (XAF)</FieldLabel>
                  <Input
                    id="publish-price"
                    type="number"
                    placeholder="0"
                    disabled={createNewspaper.isPending}
                    value={String(field.state.value)}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    onBlur={field.handleBlur}
                  />
                  <FieldError
                    errors={field.state.meta.errors.map((message) => ({ message }))}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="autoPublish">
              {(field) => (
                <Field>
                  <div className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <p className="text-sm font-medium">Publication automatique</p>
                      <p className="text-xs text-muted-foreground">
                        Cette édition sera publiée automatiquement à la date
                        prévue à 4h00.
                      </p>
                    </div>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) =>
                        field.handleChange(checked === true)
                      }
                      aria-label="Publication automatique"
                    />
                  </div>
                </Field>
              )}
            </form.Field>
          </FieldGroup>

          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([submitting]) => (
              <Button
                type="submit"
                className="w-full"
                disabled={createNewspaper.isPending || submitting}
              >
                {createNewspaper.isPending || submitting ? (
                  <>
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                    Publication en cours...
                  </>
                ) : (
                  <>
                    <Upload data-icon="inline-start" />
                    Publier l'édition
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
