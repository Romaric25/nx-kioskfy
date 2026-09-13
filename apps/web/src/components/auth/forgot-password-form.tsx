import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { initAuth, requestPasswordReset } from "@kioskfy/auth-client";
import {
  Button,
  Input,
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@kioskfy/ui";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { API_ORIGIN } from "@/lib/api";

// Initialize the auth client once (client-side only — it reads the
// session cookie via the Better Auth API).
if (typeof window !== "undefined") {
  initAuth({ baseURL: API_ORIGIN, basePath: "/api/auth" });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForgotPasswordValues {
  email: string;
}

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "" } as ForgotPasswordValues,
    onSubmit: async ({ value }) => {
      setFormError(null);
      setIsSubmitting(true);
      try {
        await requestPasswordReset({
          email: value.email,
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setIsSubmitted(true);
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

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Email envoyé !</h1>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
          <p className="font-medium mb-1">Vérifiez votre boîte de réception</p>
          <p>
            Si un compte est associé à <strong>{form.state.values.email}</strong>,
            vous recevrez un lien pour réinitialiser votre mot de passe.
          </p>
          <p className="mt-2 text-xs opacity-80">
            Pensez à vérifier vos spams.
          </p>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link to="/login">Retour à la connexion</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Mot de passe oublié ?
        </h1>
        <p className="text-muted-foreground text-sm">
          Entrez votre adresse email et nous vous enverrons un lien pour
          réinitialiser votre mot de passe.
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
                <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    autoComplete="email"
                    disabled={isSubmitting}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
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
                  Envoi en cours...
                </>
              ) : (
                "Envoyer le lien"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="text-center">
        <Link
          to="/login"
          className="text-sm text-muted-foreground hover:text-primary inline-flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
