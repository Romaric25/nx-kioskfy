import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import {
  updateUser,
  refreshSession,
  useSession,
} from "@kioskfy/auth-client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
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
  Label,
} from "@kioskfy/ui";
import {
  User,
  Mail,
  Shield,
  Loader2,
  Save,
  X,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/profil")({
  component: ProfilPage,
});

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface ProfileFormValues {
  name: string;
  lastName: string;
  phone: string;
  address: string;
}

function ProfilPage() {
  const { user } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const firstName = user?.name?.split(" ")[0] ?? "";
  const lastName =
    user?.name?.split(" ").slice(1).join(" ") ?? "";

  const form = useForm({
    defaultValues: {
      name: firstName,
      lastName: lastName,
      phone: "",
      address: "",
    } as ProfileFormValues,
    onSubmit: async ({ value }) => {
      setFormError(null);
      setFormSuccess(null);
      setIsSubmitting(true);
      try {
        await updateUser({
          name: `${value.name.trim()} ${value.lastName.trim()}`.trim(),
          lastName: value.lastName.trim(),
          phone: value.phone.trim() || undefined,
          address: value.address.trim() || undefined,
        });
        setFormSuccess("Profil mis à jour avec succès");
        await refreshSession();
        setIsEditing(false);
      } catch (err) {
        setFormError(
          err instanceof Error && err.message
            ? err.message
            : "Une erreur est survenue lors de la mise à jour",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          Mon profil
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos informations personnelles
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Picture Card */}
        <Card>
          <CardHeader>
            <CardTitle>Photo de profil</CardTitle>
            <CardDescription>
              Votre photo n&apos;est pas visible par les autres utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
                <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {user?.emailVerified ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <Shield data-icon="inline-start" />
                      Email vérifié
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                      Email non vérifié
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations de profil
                </CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {formSuccess && !isEditing && (
              <div
                role="status"
                className="mb-4 rounded-md bg-primary/10 px-4 py-2 text-sm text-foreground"
              >
                {formSuccess}
              </div>
            )}

            {isEditing ? (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <form.Field
                      name="name"
                      validators={{
                        onChange: ({ value }) =>
                          !value ? "Le prénom est requis" : undefined,
                      }}
                    >
                      {(field) => (
                        <Field data-invalid={!!field.state.meta.errors.length || undefined}>
                          <FieldLabel htmlFor="profile-name">Prénom</FieldLabel>
                          <Input
                            id="profile-name"
                            placeholder="Votre prénom"
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
                    </form.Field>

                    <form.Field name="lastName">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor="profile-lastname">Nom</FieldLabel>
                          <Input
                            id="profile-lastname"
                            placeholder="Votre nom"
                            disabled={isSubmitting}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                          />
                        </Field>
                      )}
                    </form.Field>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="profile-email"
                        type="email"
                        value={user?.email || ""}
                        className="pl-10 bg-muted"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      L&apos;adresse email ne peut pas être modifiée
                    </p>
                  </div>

                  <form.Field name="phone">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="profile-phone">Téléphone</FieldLabel>
                        <Input
                          id="profile-phone"
                          placeholder="Entrez votre numéro"
                          disabled={isSubmitting}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="address">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="profile-address">Adresse</FieldLabel>
                        <Input
                          id="profile-address"
                          placeholder="Votre adresse"
                          disabled={isSubmitting}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                        />
                      </Field>
                    )}
                  </form.Field>
                </FieldGroup>

                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                  >
                    <X data-icon="inline-start" />
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 data-icon="inline-start" className="animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save data-icon="inline-start" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="profile-firstname-view">Prénom</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="profile-firstname-view"
                        value={firstName}
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-lastname-view">Nom</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="profile-lastname-view"
                        value={lastName}
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email-view">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profile-email-view"
                      type="email"
                      value={user?.email || ""}
                      className="pl-10"
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-phone-view">Téléphone</Label>
                  <Input
                    id="profile-phone-view"
                    value=""
                    disabled
                    placeholder="Non renseigné"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
