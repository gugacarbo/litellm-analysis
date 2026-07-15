import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { PageHeader } from "@/features/app-shell/components/page-header";
import { saveModelInputSchema } from "@/features/model-admin/contracts/model-admin";
import {
  invalidateModelAdmin,
  modelAdminQueries,
} from "@/features/model-admin/query/query-options";
import { saveModel } from "@/features/model-admin/server/model-admin.functions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

const settingsSchema = saveModelInputSchema.pick({
  id: true,
  providerId: true,
  modelId: true,
  enabled: true,
  expectedRevision: true,
  displayName: true,
  family: true,
  canonicalSlug: true,
  description: true,
  contextLength: true,
  maxCompletionTokens: true,
  knowledgeCutoff: true,
  expirationDate: true,
});
type SettingsValues = z.infer<typeof settingsSchema>;
type ModelSettingsPageProps = Readonly<{
  modelId: string;
  role: "admin" | "viewer";
}>;

export function ModelSettingsPage({ modelId, role }: ModelSettingsPageProps) {
  const queryClient = useQueryClient();
  const modelQuery = useQuery(modelAdminQueries.model(modelId));
  const [aliases, setAliases] = useState("");
  const [advancedConfiguration, setAdvancedConfiguration] = useState("{}");
  const [error, setError] = useState("");
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
  });
  useEffect(() => {
    if (!modelQuery.data) return;
    const model = modelQuery.data;
    form.reset({
      id: model.id,
      providerId: model.providerId,
      modelId: model.modelId,
      enabled: model.enabled,
      expectedRevision: model.revision,
      displayName: model.displayName,
      family: model.family,
      canonicalSlug: model.canonicalSlug,
      description: model.description,
      contextLength: model.contextLength,
      maxCompletionTokens: model.maxCompletionTokens,
      knowledgeCutoff: model.knowledgeCutoff,
      expirationDate: model.expirationDate,
    });
    setAliases(model.aliases.map((alias) => alias.alias).join("\n"));
    setAdvancedConfiguration(
      JSON.stringify(
        {
          architecture: model.architecture,
          reasoning: model.reasoning,
          supportedParameters: model.supportedParameters,
          defaultParameters: model.defaultParameters,
          perRequestLimits: model.perRequestLimits,
          pricing: model.pricing,
          requestOptions: model.requestOptions,
          reasoningApiId: model.reasoningApiId,
        },
        null,
        2,
      ),
    );
  }, [form, modelQuery.data]);
  const saveMutation = useMutation({
    mutationFn: async (values: SettingsValues) => {
      let advanced: unknown;
      try {
        advanced = JSON.parse(advancedConfiguration);
      } catch {
        throw new Error("Advanced configuration must be valid JSON.");
      }
      const payload = saveModelInputSchema.safeParse({
        ...values,
        aliases: aliases
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        ...(advanced && typeof advanced === "object" ? advanced : {}),
      });
      if (!payload.success) throw new Error(payload.error.issues[0]?.message);
      const result = await saveModel({ data: payload.data });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: async (model) => {
      await invalidateModelAdmin.model(queryClient, {
        id: model.id,
        providerId: model.providerId,
        aliasesChanged: true,
      });
      setError("");
    },
    onError: (reason) => {
      const conflict = reason as { message?: string; currentRevision?: number };
      setError(
        conflict.currentRevision
          ? `${conflict.message ?? "Conflict"} Reload to use revision ${conflict.currentRevision}.`
          : (conflict.message ?? "Could not save model"),
      );
    },
  });
  if (modelQuery.isPending)
    return <section aria-busy="true">Loading model settings…</section>;
  if (modelQuery.isError)
    return (
      <section className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>
            {(modelQuery.error as { code?: string }).code === "NOT_FOUND"
              ? "Model not found"
              : "Could not load model"}
          </AlertTitle>
          <AlertDescription>{modelQuery.error.message}</AlertDescription>
        </Alert>
        <Button onClick={() => void modelQuery.refetch()}>Try again</Button>
        <a className="text-primary hover:underline" href="/models">
          Back to models
        </a>
      </section>
    );
  const model = modelQuery.data;
  if (!model)
    return (
      <section className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Model not found</AlertTitle>
          <AlertDescription>
            This model no longer exists. You can return to the registry.
          </AlertDescription>
        </Alert>
        <a className="text-primary hover:underline" href="/models">
          Back to models
        </a>
      </section>
    );
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/models">Models</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{model.modelId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <PageHeader
          title={`${model.providerName}/${model.modelId}`}
          subtitle={`UUID ${model.id} · revision ${model.revision}`}
        />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            onSubmit={form.handleSubmit((values) =>
              saveMutation.mutate(values),
            )}
            className="grid gap-4 md:grid-cols-2"
          >
            <ReadonlyInput label="Provider ID" value={model.providerId} />
            <Controller
              control={form.control}
              name="modelId"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Model ID</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    disabled={role !== "admin"}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="displayName"
              render={({ field, fieldState }) => (
                <TextField
                  field={field}
                  state={fieldState}
                  label="Display name"
                  disabled={role !== "admin"}
                />
              )}
            />
            <Controller
              control={form.control}
              name="family"
              render={({ field, fieldState }) => (
                <TextField
                  field={field}
                  state={fieldState}
                  label="Family"
                  disabled={role !== "admin"}
                />
              )}
            />
            <Controller
              control={form.control}
              name="canonicalSlug"
              render={({ field, fieldState }) => (
                <TextField
                  field={field}
                  state={fieldState}
                  label="Canonical slug"
                  disabled={role !== "admin"}
                />
              )}
            />
            <Controller
              control={form.control}
              name="contextLength"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Context length</FieldLabel>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.value ?? ""}
                    disabled={role !== "admin"}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="maxCompletionTokens"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Max completion tokens
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.value ?? ""}
                    disabled={role !== "admin"}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="aliases">Aliases (one per line)</FieldLabel>
              <Textarea
                id="aliases"
                value={aliases}
                onChange={(event) => setAliases(event.target.value)}
                disabled={role !== "admin"}
                className="min-h-28"
              />
            </Field>
            <Accordion
              className="md:col-span-2"
              defaultValue={["advanced-configuration"]}
            >
              <AccordionItem value="advanced-configuration">
                <AccordionTrigger>
                  Capabilities, routing and request options (JSON)
                </AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    id="advanced-configuration"
                    value={advancedConfiguration}
                    onChange={(event) =>
                      setAdvancedConfiguration(event.target.value)
                    }
                    disabled={role !== "admin"}
                    className="min-h-56 font-mono text-xs"
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Supports architecture, reasoning, parameters, limits,
                    pricing and request options. Values are validated before
                    saving.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field className="md:col-span-2">
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(event.target.value || null)
                    }
                    disabled={role !== "admin"}
                    className="min-h-28"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            {role === "admin" ? (
              <div className="md:col-span-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving…" : "Save settings"}
                </Button>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function ReadonlyInput({ label, value }: { label: string; value: string }) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input value={value} disabled readOnly />
    </Field>
  );
}
function TextField({
  field,
  state,
  label,
  disabled,
}: {
  field: {
    name: string;
    value?: string | null;
    onChange: (value: string | null) => void;
  };
  state: { invalid: boolean; error?: { message?: string } };
  label: string;
  disabled: boolean;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        value={field.value ?? ""}
        onChange={(event) => field.onChange(event.target.value || null)}
        disabled={disabled}
        aria-invalid={state.invalid}
      />
      <FieldError errors={[state.error]} />
    </Field>
  );
}
