import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { changePassword } from "@kioskfy/auth-client";
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
  useTheme,
  cn,
} from "@kioskfy/ui";
import { Settings, KeyRound, Loader2, Sun, Moon, Monitor } from "lucide-react";

export const Route = createFileRoute("/dashboard/parametres")({
  component: ParametresPage,
});

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const THEME_OPTIONS = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Monitor },
] as const;

function ParametresPage() {
  const { theme, setTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    } as PasswordFormValues,
    onSubmit: async ({ value }) => {
      setFormError(null);
      setFormSuccess(null);
      setIsSubmitting(true);
      try {
        await changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          revokeOtherSessions: true,
        });
        setFormSuccess("Mot de passe modifié avec succès");
        passwordForm.reset();
      } catch (err) {
        setFormError(
          err instanceof Error && err.message
            ? err.message
            : "Une erreur est survenue lors du changement de mot de passe",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Paramètres
        </h1>
        <p className="text-muted-foreground mt-1">
          Personnalisez votre expérience sur kioskfy
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
          <CardDescription>
            Choisissez le thème de l&apos;interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((option) => {
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted/50 text-muted-foreground",
                  )}
                >
                  <option.icon className="h-5 w-5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Mot de passe
          </CardTitle>
          <CardDescription>
            Modifiez votre mot de passe. Vous serez déconnecté des autres
            appareils.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formSuccess && (
            <div
              role="status"
              className="mb-4 rounded-md bg-primary/10 px-4 py-2 text-sm text-foreground"
            >
              {formSuccess}
            </div>
          )}
          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              passwordForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <FieldGroup>
              <passwordForm.Field
                name="currentPassword"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Le mot de passe actuel est requis" : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                    <FieldLabel htmlFor="current-password">
                      Mot de passe actuel
                    </FieldLabel>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
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
              </passwordForm.Field>

              <passwordForm.Field
                name="newPassword"
                validators={{
                  onChange: ({ value }) =>
                    !value || value.length < 8
                      ? "Le mot de passe doit faire au moins 8 caractères"
                      : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                    <FieldLabel htmlFor="new-password">
                      Nouveau mot de passe
                    </FieldLabel>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
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
              </passwordForm.Field>

              <passwordForm.Field
                name="confirmPassword"
                validators={{
                  onChange: ({ value }) =>
                    value !== passwordForm.getFieldValue("newPassword")
                      ? "Les mots de passe ne correspondent pas"
                      : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                    <FieldLabel htmlFor="confirm-password">
                      Confirmer le nouveau mot de passe
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
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
              </passwordForm.Field>
            </FieldGroup>

            <passwordForm.Subscribe selector={(state) => [state.isSubmitting]}>
              {([submitting]) => (
                <Button type="submit" disabled={isSubmitting || submitting}>
                  {isSubmitting || submitting ? (
                    <>
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                      Modification en cours...
                    </>
                  ) : (
                    "Changer le mot de passe"
                  )}
                </Button>
              )}
            </passwordForm.Subscribe>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
