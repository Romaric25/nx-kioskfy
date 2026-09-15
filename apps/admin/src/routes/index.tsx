import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useSession, useSignIn, isAdminRole } from "@kioskfy/auth-client";
import { Eye, EyeOff, Loader2, Newspaper } from "lucide-react";
import {
  Button,
  Input,
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@kioskfy/ui";
import { useState } from "react";

export const Route = createFileRoute("/")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { user, isLoading: sessionLoading } = useSession();
  const { signIn } = useSignIn();
  const [showPwd, setShowPwd] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // While the session loads, render a neutral loading screen (also used during SSR).
  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Already signed in as admin → straight to the dashboard.
  if (user && isAdminRole(user)) {
    return <Navigate to="/admin" replace />;
  }

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setSubmitError("");
      try {
        await signIn({ email: value.email, password: value.password });
        navigate({ to: "/admin" });
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Identifiants invalides",
        );
      }
    },
    onSubmitInvalid: () => {
      setSubmitError("Veuillez corriger les champs en rouge.");
    },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background p-4">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Newspaper className="size-8" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Kioskfy</h1>
          <p className="mt-1 text-sm text-muted-foreground">Panneau d&apos;administration</p>
        </div>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        {submitError && (
          <p className="mb-4 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {submitError}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) =>
                  value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                    ? "Adresse email invalide"
                    : undefined,
              }}
            >
              {(field) => (
                <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@kioskfy.com"
                    autoComplete="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={!!field.state.meta.errors.length || undefined}
                  />
                  <FieldError errors={field.state.meta.errors.map((m) => ({ message: m }))} />
                </Field>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      tabIndex={-1}
                    >
                      {showPwd ? <EyeOff data-icon="inline-start" /> : <Eye data-icon="inline-start" />}
                    </Button>
                  </div>
                  <FieldDescription>Votre mot de passe est chiffré.</FieldDescription>
                </Field>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([isSubmitting]) => (
                <Button type="submit" disabled={isSubmitting} className="mt-2">
                  {isSubmitting && <Loader2 data-icon="inline-start" className="animate-spin" />}
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </div>

      <p className="text-xs text-muted-foreground">
        Kioskfy &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
