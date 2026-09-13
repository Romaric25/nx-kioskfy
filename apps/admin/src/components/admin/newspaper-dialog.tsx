import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Loader2, Plus } from "lucide-react";
import type {
  CategoryItem,
  CountryItem,
  CreateNewspaperInput,
  OrganizationItem,
} from "@kioskfy/types";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@kioskfy/ui";
import { api } from "../../lib/api";

interface CreateNewspaperFormValues {
  issueNumber: string;
  publishDate: string;
  price: string;
  status: "draft" | "published";
  organizationId: string;
  country: string;
  categoryIds: number[];
  autoPublish: boolean;
}

interface NewspaperDialogProps {
  onCreated: () => void;
}

export function NewspaperDialog({ onCreated }: NewspaperDialogProps) {
  const [open, setOpen] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    Promise.all([api.organizations.getAll(), api.countries.getAll(), api.categories.getAll()])
      .then(([orgs, ctry, cats]) => {
        setOrganizations(Array.isArray(orgs) ? orgs : []);
        setCountries(Array.isArray(ctry) ? ctry : []);
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch(() => setLoadError("Impossible de charger les listes (organisations, pays, catégories)"));
  }, [open]);

  const form = useForm({
    defaultValues: {
      issueNumber: "",
      publishDate: new Date().toISOString().slice(0, 10),
      price: "",
      status: "draft",
      organizationId: "",
      country: "",
      categoryIds: [],
      autoPublish: false,
    } as CreateNewspaperFormValues,
    onSubmit: async ({ value }) => {
      const input: CreateNewspaperInput = {
        issueNumber: value.issueNumber,
        publishDate: value.publishDate,
        price: Number(value.price),
        status: value.status,
        organizationId: value.organizationId,
        country: value.country,
        categoryIds: value.categoryIds,
        autoPublish: value.autoPublish,
      };
      await api.newspapers.create(input);
      form.reset();
      setOpen(false);
      onCreated();
    },
  });

  const invalid = (field: { state: { meta: { isTouched: boolean; errors: unknown[] } } }) =>
    field.state.meta.isTouched && field.state.meta.errors.length > 0 ? true : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Nouveau journal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouveau journal</DialogTitle>
          <DialogDescription>
            Créez une édition et publiez-la immédiatement ou en brouillon.
          </DialogDescription>
        </DialogHeader>

        {loadError && (
          <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {loadError}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="max-h-[60vh] overflow-y-auto px-0.5"
        >
          <FieldGroup>
            <form.Field
              name="issueNumber"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Le numéro d'édition est requis" : undefined,
              }}
            >
              {(field) => (
                <Field data-invalid={invalid(field)}>
                  <FieldLabel htmlFor={field.name}>Numéro d'édition</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Édition #42"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={invalid(field)}
                  />
                  <FieldError errors={field.state.meta.errors.map((m) => ({ message: m }))} />
                </Field>
              )}
            </form.Field>

            <form.Field name="publishDate">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Date de publication</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field
              name="price"
              validators={{
                onChange: ({ value }) => {
                  const n = Number(value);
                  if (!value.trim() || Number.isNaN(n)) return "Prix invalide";
                  if (n <= 0) return "Le prix doit être supérieur à 0";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <Field data-invalid={invalid(field)}>
                  <FieldLabel htmlFor={field.name}>Prix (XAF)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    inputMode="decimal"
                    placeholder="500"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={invalid(field)}
                  />
                  <FieldError errors={field.state.meta.errors.map((m) => ({ message: m }))} />
                </Field>
              )}
            </form.Field>

            <form.Field name="status">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Statut</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as "draft" | "published")}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue placeholder="Choisir un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Un brouillon reste invisible sur la boutique.
                  </FieldDescription>
                </Field>
              )}
            </form.Field>

            <form.Field
              name="organizationId"
              validators={{
                onChange: ({ value }) => (!value ? "L'organisation est requise" : undefined),
              }}
            >
              {(field) => (
                <Field data-invalid={invalid(field)}>
                  <FieldLabel htmlFor={field.name}>Organisation</FieldLabel>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue placeholder="Choisir une organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={field.state.meta.errors.map((m) => ({ message: m }))} />
                </Field>
              )}
            </form.Field>

            <form.Field
              name="country"
              validators={{
                onChange: ({ value }) => (!value ? "Le pays est requis" : undefined),
              }}
            >
              {(field) => (
                <Field data-invalid={invalid(field)}>
                  <FieldLabel htmlFor={field.name}>Pays</FieldLabel>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue placeholder="Choisir un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.name}>
                          {country.flag} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={field.state.meta.errors.map((m) => ({ message: m }))} />
                </Field>
              )}
            </form.Field>

            <form.Field name="categoryIds">
              {(field) => (
                <FieldSet>
                  <FieldLegend>Catégories</FieldLegend>
                  {categories.length === 0 ? (
                    <FieldDescription>
                      Aucune catégorie disponible pour le moment.
                    </FieldDescription>
                  ) : (
                    categories.map((category) => (
                      <Field key={category.id} orientation="horizontal">
                        <FieldContent>
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={field.state.value.includes(category.id)}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...field.state.value, category.id]
                                : field.state.value.filter((id) => id !== category.id);
                              field.handleChange(next);
                            }}
                          />
                        </FieldContent>
                        <FieldLabel htmlFor={`category-${category.id}`}>
                          {category.name}
                        </FieldLabel>
                      </Field>
                    ))
                  )}
                </FieldSet>
              )}
            </form.Field>

            <form.Field name="autoPublish">
              {(field) => (
                <Field orientation="horizontal">
                  <FieldLabel htmlFor={field.name}>Publication automatique</FieldLabel>
                  <Switch
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([isSubmitting]) => (
              <Button
                type="button"
                onClick={() => form.handleSubmit()}
                disabled={isSubmitting || !form.state.canSubmit}
              >
                {isSubmitting && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {isSubmitting ? "Création…" : "Créer le journal"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
