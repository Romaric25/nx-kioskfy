import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { initAuth, useSignIn, isAgencyUser } from "@kioskfy/auth-client";
import {
  Button,
  Input,
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@kioskfy/ui";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { API_ORIGIN } from "@/lib/api";

// Initialize the auth client once (client-side only).
if (typeof window !== "undefined") {
  initAuth({ baseURL: API_ORIGIN, basePath: "/api/auth" });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginForm({ redirectDefault = "/organization/dashboard" }: { redirectDefault?: string }) {
  const navigate = useNavigate();
  const { signIn } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const searchParams = useSearch({ strict: false }) as Record<
    string,
    string | undefined
  >;
  const redirect = searchParams["redirect"];

  const form = useForm({
    defaultValues: { email: "", password: "" } as LoginFormValues,
    onSubmit: async ({ value }) => {
      setLoginError(null);
      setIsLoading(true);
      try {
        const user = await signIn({
          email: value.email,
          password: value.password,
        });
        if (user && !isAgencyUser(user)) {
          setLoginError("Ce compte n'est pas un compte agence de presse.");
          return;
        }
        navigate({ to: (redirect || redirectDefault) as never, replace: true });
      } catch (err) {
        setLoginError(
          err instanceof Error && err.message
            ? err.message
            : "Identifiants invalides",
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="w-full max-w-md space-y-6 bg-background p-8 rounded-lg border shadow-sm">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Espace Partenaire</h1>
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour gérer vos publications
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {loginError && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {loginError}
          </div>
        )}

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
                <FieldLabel htmlFor="labo-email">Email professionnel</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="labo-email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    autoComplete="email"
                    disabled={isLoading}
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

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                !value ? "Le mot de passe est requis" : undefined,
            }}
          >
            {(field) => (
              <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                <FieldLabel htmlFor="labo-password">Mot de passe</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="labo-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre mot de passe"
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                    disabled={isLoading}
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
        </FieldGroup>

        <div className="flex items-center justify-between">
          <div />
        </div>

        <form.Subscribe selector={(state) => [state.isSubmitting]}>
          {([submitting]) => (
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || submitting}
            >
              {isLoading || submitting ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Accéder au tableau de bord"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Vous souhaitez devenir partenaire ?{" "}
        <Link
          to="/organization/subscription"
          className="text-primary hover:underline font-medium"
        >
          Faire une demande
        </Link>
      </p>
    </div>
  );
}
