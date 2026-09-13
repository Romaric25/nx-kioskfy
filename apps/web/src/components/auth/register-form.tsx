import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useSearch, Link } from "@tanstack/react-router";
import { initAuth, useSignUp, useSignIn } from "@kioskfy/auth-client";
import {
  Button,
  Input,
  Checkbox,
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@kioskfy/ui";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
} from "lucide-react";
import { API_ORIGIN } from "@/lib/api";

// Initialize the auth client once (client-side only).
if (typeof window !== "undefined") {
  initAuth({ baseURL: API_ORIGIN, basePath: "/api/auth" });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterFormValues {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsAcceptance: boolean;
}

export function RegisterForm() {
  const navigate = useNavigate();
  const { signUp, isLoading: isSigningUp } = useSignUp();
  const { signIn } = useSignIn();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const searchParams = useSearch({ strict: false }) as Record<
    string,
    string | undefined
  >;
  const redirect = searchParams["redirect"];

  const form = useForm({
    defaultValues: {
      name: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      termsAcceptance: false,
    } as RegisterFormValues,
    onSubmit: async ({ value }) => {
      setRegisterError(null);
      try {
        await signUp({
          email: value.email,
          password: value.password,
          name: value.name,
          lastName: value.lastName,
          phone: value.phone || undefined,
        });
        // The API does not auto sign-in after sign-up.
        await signIn({ email: value.email, password: value.password });
        if (redirect && redirect.startsWith("/")) {
          navigate({ to: redirect as never });
        } else {
          navigate({ to: "/" });
        }
      } catch (err) {
        setRegisterError(
          err instanceof Error && err.message
            ? err.message
            : "Une erreur est survenue lors de l'inscription.",
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
        <h1 className="text-3xl font-bold tracking-tight">Inscription</h1>
        <p className="text-muted-foreground">Créez votre compte Kioskfy</p>
      </div>

      {registerError && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive"
        >
          {registerError}
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
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Le prénom est requis" : undefined,
              }}
            >
              {(field) => (
                <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                  <FieldLabel htmlFor="register-name">Prénom</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-name"
                      placeholder="Jean"
                      className="pl-10"
                      autoComplete="given-name"
                      disabled={isSigningUp}
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
              name="lastName"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Le nom est requis" : undefined,
              }}
            >
              {(field) => (
                <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                  <FieldLabel htmlFor="register-lastname">Nom</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-lastname"
                      placeholder="Dupont"
                      className="pl-10"
                      autoComplete="family-name"
                      disabled={isSigningUp}
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
          </div>

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
                <FieldLabel htmlFor="register-email">Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="votreemail@exemple.com"
                    className="pl-10"
                    autoComplete="email"
                    disabled={isSigningUp}
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

          <form.Field name="phone">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="register-phone">Téléphone</FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-phone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    className="pl-10"
                    autoComplete="tel"
                    disabled={isSigningUp}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              </Field>
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Le mot de passe est requis";
                if (value.length < 8)
                  return "Le mot de passe doit contenir au moins 8 caractères";
                return undefined;
              },
            }}
          >
            {(field) => (
              <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                <FieldLabel htmlFor="register-password">Mot de passe</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre mot de passe"
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    disabled={isSigningUp}
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
              onChange: ({ value }) => {
                if (!value) return "La confirmation est requise";
                if (value !== form.getFieldValue("password"))
                  return "Les mots de passe ne correspondent pas";
                return undefined;
              },
            }}
          >
            {(field) => (
              <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                <FieldLabel htmlFor="register-confirm-password">
                  Confirmer le mot de passe
                </FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmez votre mot de passe"
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    disabled={isSigningUp}
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

          <form.Field
            name="termsAcceptance"
            validators={{
              onChange: ({ value }) =>
                !value ? "Vous devez accepter les conditions" : undefined,
            }}
          >
            {(field) => (
              <Field
                orientation="horizontal"
                data-invalid={!!field.state.meta.errors.length || undefined}
              >
                <Checkbox
                  id="register-terms"
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                  disabled={isSigningUp}
                />
                <FieldLabel htmlFor="register-terms">
                  J'accepte les conditions générales d'utilisation
                </FieldLabel>
                <FieldError
                  errors={field.state.meta.errors.map((message) => ({ message }))}
                />
              </Field>
            )}
          </form.Field>
        </FieldGroup>

        <form.Subscribe selector={(state) => [state.isSubmitting]}>
          {([isSubmitting]) => (
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSigningUp || isSubmitting}
            >
              {isSigningUp || isSubmitting ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Création du compte...
                </>
              ) : (
                "Créer un compte"
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
        Vous avez déjà un compte ?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
