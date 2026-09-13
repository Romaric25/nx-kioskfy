import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useSearch, Link } from "@tanstack/react-router";
import { initAuth, useSignIn } from "@kioskfy/auth-client";
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

// Initialize the auth client once (client-side only — it reads the
// session cookie via the Better Auth API).
if (typeof window !== "undefined") {
  initAuth({ baseURL: API_ORIGIN, basePath: "/api/auth" });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginForm() {
  const navigate = useNavigate();
  const { signIn, isLoading: isSigningIn } = useSignIn();
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
      try {
        await signIn({ email: value.email, password: value.password });
        if (redirect && redirect.startsWith("/")) {
          navigate({ to: redirect as never });
        } else {
          navigate({ to: "/" });
        }
      } catch (err) {
        setLoginError(
          err instanceof Error && err.message
            ? err.message
            : "Identifiants invalides",
        );
      }
    },
  });

  const openSocialAuth = (provider: "google" | "facebook") => {
    const callbackURL = `${window.location.origin}${
      redirect && redirect.startsWith("/") ? redirect : "/"
    }`;
    window.location.href = `${API_ORIGIN}/api/auth/sign-in/social?provider=${provider}&callbackURL=${encodeURIComponent(callbackURL)}`;
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Connexion</h1>
        <p className="text-muted-foreground">
          Connectez-vous à votre compte kioskfy.com
        </p>
      </div>

      {loginError && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive"
        >
          {loginError}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-6"
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
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="votreemail@exemple.com"
                    className="pl-10"
                    autoComplete="email"
                    disabled={isSigningIn}
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
                <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                    disabled={isSigningIn}
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
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline underline-offset-4"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <form.Subscribe selector={(state) => [state.isSubmitting]}>
          {([isSubmitting]) => (
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSigningIn || isSubmitting}
            >
              {isSigningIn || isSubmitting ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continuer avec
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => openSocialAuth("google")}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => openSocialAuth("facebook")}
        >
          <svg
            className="mr-2 h-4 w-4 text-[#1877F2]"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Vous n'avez pas de compte ?{" "}
        <Link to="/register" className="text-primary hover:underline font-medium">
          S'inscrire
        </Link>
      </p>
    </div>
  );
}
