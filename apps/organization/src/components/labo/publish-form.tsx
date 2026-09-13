import { useEffect, useState } from "react";
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
import { FileText, Loader2, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { useActiveOrganization } from "@/hooks/use-organizations.hook";

interface PublishFormValues {
  issueNumber: string;
  publishDate: string;
  price: number;
  autoPublish: boolean;
}

/** Publish a new edition for the selected agency. */
export function PublishForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization, isLoading: isLoadingOrganization } =
    useActiveOrganization();
  const [formError, setFormError] = useState<string | null>(null);

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
