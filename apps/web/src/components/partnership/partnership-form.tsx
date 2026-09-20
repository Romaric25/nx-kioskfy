import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import {
  Button,
  Input,
  PhoneInput,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kioskfy/ui";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isProd = import.meta.env?.PROD;
const laboUrl = import.meta.env?.VITE_LABO_URL;
const laboHost = laboUrl ? new URL(laboUrl).hostname : "labo.kioskfy.com";

/** Login page of the agency portal (external in prod, internal route in dev). */
const loginUrl = isProd
  ? `https://${laboHost}/organization/login`
  : "/organization/login";

interface PartnershipFormValues {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsAcceptance: boolean;
}

export function PartnershipForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      termsAcceptance: false,
    } as PartnershipFormValues,
    onSubmit: async ({ value }) => {
      setFormError(null);
      setIsSubmitting(true);
      try {
        await api.users.createPartnership({
          email: value.email,
          password: value.password,
          name: value.name,
          lastName: value.lastName,
          typeUser: "agency",
          phone: value.phone,
          termsAcceptance: true,
          confirmPassword: value.confirmPassword,
        });
        setShowSuccessDialog(true);
        form.reset();
      } catch (err) {
        setFormError(
          err instanceof Error && err.message
            ? err.message
            : "Erreur lors de l'inscription",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full mx-auto max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-lg">
      <div className="flex flex-col items-center text-center space-y-2">
        <h2 className="text-xl font-semibold">Créer un compte partenaire</h2>
        <p className="text-muted-foreground">
          Créez votre compte pro kioskfy
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {formError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

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
                <Field
                  data-invalid={!!field.state.meta.errors.length || undefined}
                >
                  <FieldLabel htmlFor="part-name">Prénom *</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="part-name"
                      placeholder="Jean"
                      className="pl-10"
                      autoComplete="given-name"
                      disabled={isSubmitting}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                  <FieldError
                    errors={field.state.meta.errors.map((message) => ({
                      message,
                    }))}
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
                <Field
                  data-invalid={!!field.state.meta.errors.length || undefined}
                >
                  <FieldLabel htmlFor="part-lastname">Nom *</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="part-lastname"
                      placeholder="Dupont"
                      className="pl-10"
                      autoComplete="family-name"
                      disabled={isSubmitting}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                  <FieldError
                    errors={field.state.meta.errors.map((message) => ({
                      message,
                    }))}
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
              <Field
                data-invalid={!!field.state.meta.errors.length || undefined}
              >
                <FieldLabel htmlFor="part-email">Email *</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="part-email"
                    type="email"
                    placeholder="votreemail@exemple.com"
                    className="pl-10"
                    autoComplete="email"
                    disabled={isSubmitting}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
                <FieldError
                  errors={field.state.meta.errors.map((message) => ({
                    message,
                  }))}
                />
              </Field>
            )}
          </form.Field>

          <form.Field
            name="phone"
            validators={{
              onChange: ({ value }) =>
                !value ? "Le téléphone est requis" : undefined,
            }}
          >
            {(field) => (
              <Field
                data-invalid={!!field.state.meta.errors.length || undefined}
              >
                <FieldLabel htmlFor="part-phone">Téléphone *</FieldLabel>
                <PhoneInput
                  id="part-phone"
                  placeholder="Entrez votre numéro"
                  autoComplete="tel"
                  disabled={isSubmitting}
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  onBlur={field.handleBlur}
                />
                <FieldError
                  errors={field.state.meta.errors.map((message) => ({
                    message,
                  }))}
                />
              </Field>
            )}
          </form.Field>

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
              <Field
                data-invalid={!!field.state.meta.errors.length || undefined}
              >
                <FieldLabel htmlFor="part-password">Mot de passe *</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="part-password"
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
                    aria-label="Afficher le mot de passe"
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
                  errors={field.state.meta.errors.map((message) => ({
                    message,
                  }))}
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
              <Field
                data-invalid={!!field.state.meta.errors.length || undefined}
              >
                <FieldLabel htmlFor="part-confirm">
                  Confirmer le mot de passe *
                </FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="part-confirm"
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
                    aria-label="Afficher la confirmation"
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
                  errors={field.state.meta.errors.map((message) => ({
                    message,
                  }))}
                />
              </Field>
            )}
          </form.Field>

          <form.Field
            name="termsAcceptance"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? "Vous devez accepter les conditions pour continuer"
                  : undefined,
            }}
          >
            {(field) => (
              <Field
                data-invalid={!!field.state.meta.errors.length || undefined}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="part-terms"
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="part-terms"
                    className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    J&apos;accepte les{" "}
                    <Link
                      to="/cgc"
                      target="_blank"
                      className="text-primary hover:underline font-medium"
                    >
                      conditions générales
                    </Link>{" "}
                    d&apos;utilisation et de vente
                  </label>
                </div>
                <FieldError
                  errors={field.state.meta.errors.map((message) => ({
                    message,
                  }))}
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
              size="lg"
              disabled={isSubmitting || submitting}
            >
              {isSubmitting || submitting ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                "Créer un compte"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Vous avez déjà un compte ?{" "}
        {isProd ? (
          <a href={loginUrl} className="text-primary hover:underline font-medium">
            Se connecter
          </a>
        ) : (
          <Link
            to="/organization/login"
            className="text-primary hover:underline font-medium"
          >
            Se connecter
          </Link>
        )}
      </p>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
            <DialogTitle className="text-center">
              Inscription réussie !
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-3 text-sm text-muted-foreground">
            <p>
              Votre compte a été créé avec succès. Veuillez vérifier votre
              email pour activer votre compte.
            </p>
          </div>
          <Button
            onClick={() => {
              setShowSuccessDialog(false);
              if (isProd) {
                window.location.href = loginUrl;
              } else {
                navigate({ to: "/organization/login" });
              }
            }}
            className="w-full"
          >
            Aller à la page de connexion
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
