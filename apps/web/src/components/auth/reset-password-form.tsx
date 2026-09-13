import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { initAuth, resetPassword } from "@kioskfy/auth-client";
import {
  Button,
  Input,
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@kioskfy/ui";
import { Eye, EyeOff, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { API_ORIGIN } from "@/lib/api";

// Initialize the auth client once (client-side only — it reads the
// session cookie via the Better Auth API).
if (typeof window !== "undefined") {
  initAuth({ baseURL: API_ORIGIN, basePath: "/api/auth" });
}

interface ResetPasswordValues {
  password: string;
  confirmPassword: string;
}

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as Record<
    string,
    string | undefined
  >;
  const token = searchParams["token"];
  const errorParam = searchParams["error"];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    } as ResetPasswordValues,
    onSubmit: async ({ value }) => {
      setFormError(null);

      if (!token) {
        setFormError("Jeton de réinitialisation manquant ou invalide.");
        return;
      }

      setIsSubmitting(true);
      try {
        await resetPassword({
          newPassword: value.password,
          token,
        });
        setIsSuccess(true);
        setTimeout(() => navigate({ to: "/login" }), 3000);
      } catch (err) {
        setFormError(
          err instanceof Error && err.message
            ? err.message
            : "Une erreur est survenue. Veuillez réessayer.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  if (errorParam === "token_expired" || errorParam === "invalid_token") {
    return (
      <div className="text-center space-y-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-bold">Lien expiré ou invalide</p>
          <p>Veuillez faire une nouvelle demande de mot de passe oublié.</p>
        </div>
        <Button className="w-full" asChild>
          <Link to="/forgot-password">Nouvelle demande</Link>
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Mot de passe modifié
          </h2>
          <p className="text-muted-foreground mt-2">
            Vous pouvez maintenant vous connecter avec votre nouveau mot de
            passe.
          </p>
        </div>
        <Button className="w-full" asChild>
          <Link to="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Réinitialisation</h1>
        <p className="text-muted-foreground text-sm">
          Choisissez votre nouveau mot de passe
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <FieldGroup>
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                !value || value.length < 8
                  ? "Le mot de passe doit faire au moins 8 caractères"
                  : undefined,
            }}
          >
            {(field) => (
              <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                <FieldLabel htmlFor="reset-password">Nouveau mot de passe</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <FieldError
                  errors={field.state.meta.errors.map((message) => ({ message }))}
                />
              </Field>
            )}
          </form.Field>

          <form.Field
            name="confirmPassword"
            validators={{
              onChange: ({ value }) =>
                value !== form.getFieldValue("password")
                  ? "Les mots de passe ne correspondent pas"
                  : undefined,
            }}
          >
            {(field) => (
              <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                <FieldLabel htmlFor="reset-confirm">
                  Confirmer le mot de passe
                </FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <FieldError
                  errors={field.state.meta.errors.map((message) => ({ message }))}
                />
              </Field>
            )}
          </form.Field>
        </FieldGroup>

        <form.Subscribe selector={(state) => [state.isSubmitting]}>
          {([submitting]) => (
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || submitting}
            >
              {isSubmitting || submitting ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Changement en cours...
                </>
              ) : (
                "Changer le mot de passe"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
