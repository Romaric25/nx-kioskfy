import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { api } from "../../lib/api";
import type { SiteSetting } from "@kioskfy/types";
import { useEffect, useState } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";
import {
  Button,
  Input,
  Switch,
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton,
} from "@kioskfy/ui";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

interface SettingsFormValues {
  values: Record<string, unknown>;
}

function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const form = useForm({
    defaultValues: { values: {} as Record<string, unknown> },
    onSubmit: async ({ value }) => {
      try {
        await api.settings.update(value.values);
        setFeedback({ type: "success", message: "Paramètres enregistrés." });
      } catch (err) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Erreur d'enregistrement",
        });
        throw err;
      }
    },
  });

  useEffect(() => {
    api.settings
      .getAll()
      .then((data) => {
        const s = data as unknown as Record<string, SiteSetting>;
        setSettings(s);
        const initial: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(s)) {
          initial[key] = item.value;
        }
        form.setFieldValue("values", initial);
      })
      .catch(() => setFeedback({ type: "error", message: "Impossible de charger les paramètres" }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSeed = async () => {
    try {
      await api.settings.seed();
      const data = await api.settings.getAll();
      const s = data as unknown as Record<string, SiteSetting>;
      setSettings(s);
      const initial: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(s)) {
        initial[key] = item.value;
      }
      form.setFieldValue("values", initial);
      setFeedback({ type: "success", message: "Paramètres initialisés." });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur d'initialisation",
      });
    }
  };

  const groups: Record<string, SiteSetting[]> = {};
  for (const setting of Object.values(settings)) {
    if (!groups[setting.group]) groups[setting.group] = [];
    groups[setting.group].push(setting);
  }
  const groupKeys = Object.keys(groups);
  const hasSettings = groupKeys.length > 0;

  if (loading) {
    return (
      <div className="flex h-96 flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-sm text-muted-foreground">Configuration globale du site.</p>
        </div>
        <div className="flex items-center gap-2">
          {!hasSettings && (
            <Button variant="outline" onClick={handleSeed}>
              <RotateCcw data-icon="inline-start" />
              Initialiser
            </Button>
          )}
          {hasSettings && (
            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([isSubmitting]) => (
                <Button onClick={() => form.handleSubmit()} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Save data-icon="inline-start" />
                  )}
                  Enregistrer
                </Button>
              )}
            </form.Subscribe>
          )}
        </div>
      </div>

      {feedback && (
        <p
          className={
            feedback.type === "success"
              ? "rounded-md bg-primary/10 px-4 py-2 text-sm text-primary"
              : "rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive"
          }
        >
          {feedback.message}
        </p>
      )}

      {!hasSettings ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun paramètre. Initialisez la configuration par défaut.
            </p>
          </CardContent>
        </Card>
      ) : (
        <form.Field name="values">
          {(valuesField) => (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {groupKeys.map((group) => (
                  <TabsTrigger key={group} value={group} className="capitalize">
                    {group}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">{activeTab}</CardTitle>
                    <CardDescription>Configuration des paramètres {activeTab}.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      {(groups[activeTab] ?? []).map((setting) => (
                        <Field key={setting.key}>
                          {setting.type === "boolean" ? (
                            <>
                              <FieldLabel htmlFor={setting.key}>
                                {setting.label || setting.key}
                              </FieldLabel>
                              <Switch
                                id={setting.key}
                                checked={Boolean(valuesField.state.value[setting.key])}
                                onCheckedChange={(checked) => {
                                  valuesField.handleChange({
                                    ...valuesField.state.value,
                                    [setting.key]: checked,
                                  });
                                }}
                              />
                              {setting.description && (
                                <FieldDescription>{setting.description}</FieldDescription>
                              )}
                            </>
                          ) : (
                            <>
                              <FieldLabel htmlFor={setting.key}>
                                {setting.label || setting.key}
                              </FieldLabel>
                              <Input
                                id={setting.key}
                                value={String(valuesField.state.value[setting.key] ?? "")}
                                onChange={(e) => {
                                  valuesField.handleChange({
                                    ...valuesField.state.value,
                                    [setting.key]: e.target.value,
                                  });
                                }}
                              />
                              {setting.description && (
                                <FieldDescription>{setting.description}</FieldDescription>
                              )}
                            </>
                          )}
                        </Field>
                      ))}
                    </FieldGroup>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </form.Field>
      )}
    </div>
  );
}
