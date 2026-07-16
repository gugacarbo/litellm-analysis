import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { PageHeader } from "@/features/app-shell/components/page-header";
import {
  type modelDetailSchema,
  type ProviderPublic,
  saveModelInputSchema,
} from "@/features/model-admin/contracts/model-admin";
import {
  invalidateModelAdmin,
  modelAdminQueries,
} from "@/features/model-admin/query/query-options";
import {
  deleteModel,
  saveModel,
  toggleModel,
} from "@/features/model-admin/server/model-admin.functions";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";

const settingsSchema = saveModelInputSchema.pick({
  id: true,
  providerId: true,
  modelId: true,
  enabled: true,
  expectedRevision: true,
  displayName: true,
  family: true,
  description: true,
  contextLength: true,
  maxCompletionTokens: true,
  knowledgeCutoff: true,
  expirationDate: true,
});
type SettingsValues = z.infer<typeof settingsSchema>;
export const modelSettingsTabs = [
  "essential",
  "capabilities",
  "aliases",
] as const;
export type ModelSettingsTab = (typeof modelSettingsTabs)[number];
type ModelSettingsPageProps = Readonly<{
  modelId: string;
  role: "admin" | "viewer";
  activeTab?: ModelSettingsTab;
  onTabChange?: (tab: ModelSettingsTab) => void;
}>;

const supportedParameterOptions = [
  "max_tokens",
  "temperature",
  "top_p",
  "top_k",
  "frequency_penalty",
  "presence_penalty",
  "repetition_penalty",
  "seed",
  "stop",
  "tools",
  "tool_choice",
  "response_format",
  "structured_output",
  "reasoning",
  "logprobs",
  "top_logprobs",
] as const;
const inputModalityOptions = ["text", "image", "audio", "file"] as const;
const outputModalityOptions = ["text", "image", "audio"] as const;
const reasoningEffortOptions = ["low", "medium", "high", "xhigh"] as const;
const tokenizerOptions = [
  "GPT",
  "Claude",
  "Cohere",
  "DeepSeek",
  "Gemini",
  "Gemma",
  "Grok",
  "Llama2",
  "Llama3",
  "Llama4",
  "Mistral",
  "Nova",
  "Other",
  "Qwen",
  "Qwen3",
  "Router",
] as const;
const instructTypeOptions = [
  "alpaca",
  "chatml",
  "deepseek-r1",
  "deepseek-v3.1",
  "gemma",
  "llama3",
  "mistral",
  "qwen3",
  "vicuna",
] as const;

type HeaderEntry = { key: string; value: string };
type ModelDetail = z.infer<typeof modelDetailSchema>;
type AdvancedSection = "architecture" | "reasoning" | "parameters" | "limits";
type AdvancedSettings = {
  architecture: {
    inputModalities: string[];
    outputModalities: string[];
    tokenizer: string;
    instructType: string;
  };
  reasoning: {
    effort: string;
    maxTokens: string;
    supportsToolUse?: boolean;
    supportsComputerUse?: boolean;
  };
  supportedParameters: string[];
  defaultParameters: {
    temperature: string;
    topP: string;
    topK: string;
    maxTokens: string;
    frequencyPenalty: string;
    presencePenalty: string;
    repetitionPenalty: string;
    seed: string;
    stop: string;
  };
  perRequestLimits: {
    maxInputTokens: string;
    maxOutputTokens: string;
    rpm: string;
    tpm: string;
  };
  pricing: { input: string; output: string; cacheRead: string; image: string };
  requestOptions: {
    timeoutMs: string;
    maxRetries: string;
    headers: HeaderEntry[];
  };
  reasoningApiId: string;
};

function toUsableModelId(providerName: string, modelId: string) {
  const providerSlug = providerName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${providerSlug}/${modelId}`;
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall back for browsers that deny Clipboard API access.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  document.execCommand("copy");
  textArea.remove();
}

function CopyableIdentifier({
  value,
  label,
}: Readonly<{ value: string; label: string }>) {
  return (
    <span className="flex items-center gap-1 font-mono text-sm">
      <span>{value}</span>
      <Button
        aria-label={`Copy ${label}`}
        onClick={() => void copyToClipboard(value)}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <CopyIcon aria-hidden="true" className="size-3" />
      </Button>
    </span>
  );
}
const emptyAdvancedSettings: AdvancedSettings = {
  architecture: {
    inputModalities: [],
    outputModalities: [],
    tokenizer: "",
    instructType: "",
  },
  reasoning: { effort: "", maxTokens: "" },
  supportedParameters: [],
  defaultParameters: {
    temperature: "",
    topP: "",
    topK: "",
    maxTokens: "",
    frequencyPenalty: "",
    presencePenalty: "",
    repetitionPenalty: "",
    seed: "",
    stop: "",
  },
  perRequestLimits: {
    maxInputTokens: "",
    maxOutputTokens: "",
    rpm: "",
    tpm: "",
  },
  pricing: { input: "", output: "", cacheRead: "", image: "" },
  requestOptions: { timeoutMs: "", maxRetries: "", headers: [] },
  reasoningApiId: "",
};

function toInputNumber(value: number | undefined) {
  return value?.toString() ?? "";
}

function optionalNumber(value: string) {
  return value === "" ? undefined : Number(value);
}

function getAdvancedSettings(model: ModelDetail) {
  return {
    architecture: {
      inputModalities: model.architecture?.inputModalities ?? [],
      outputModalities: model.architecture?.outputModalities ?? [],
      tokenizer: model.architecture?.tokenizer ?? "",
      instructType: model.architecture?.instructType ?? "",
    },
    reasoning: {
      effort: model.reasoning?.effort ?? "",
      maxTokens: toInputNumber(model.reasoning?.maxTokens),
      supportsToolUse: model.reasoning?.supportsToolUse,
      supportsComputerUse: model.reasoning?.supportsComputerUse,
    },
    supportedParameters: model.supportedParameters ?? [],
    defaultParameters: {
      temperature: toInputNumber(model.defaultParameters?.temperature),
      topP: toInputNumber(model.defaultParameters?.topP),
      topK: toInputNumber(model.defaultParameters?.topK),
      maxTokens: toInputNumber(model.defaultParameters?.maxTokens),
      frequencyPenalty: toInputNumber(
        model.defaultParameters?.frequencyPenalty,
      ),
      presencePenalty: toInputNumber(model.defaultParameters?.presencePenalty),
      repetitionPenalty: toInputNumber(
        model.defaultParameters?.repetitionPenalty,
      ),
      seed: toInputNumber(model.defaultParameters?.seed),
      stop: model.defaultParameters?.stop?.join("\n") ?? "",
    },
    perRequestLimits: {
      maxInputTokens: toInputNumber(model.perRequestLimits?.maxInputTokens),
      maxOutputTokens: toInputNumber(model.perRequestLimits?.maxOutputTokens),
      rpm: toInputNumber(model.perRequestLimits?.rpm),
      tpm: toInputNumber(model.perRequestLimits?.tpm),
    },
    pricing: {
      input: toInputNumber(model.pricing?.input),
      output: toInputNumber(model.pricing?.output),
      cacheRead: toInputNumber(model.pricing?.cacheRead),
      image: toInputNumber(model.pricing?.image),
    },
    requestOptions: {
      timeoutMs: toInputNumber(model.requestOptions?.timeoutMs),
      maxRetries: toInputNumber(model.requestOptions?.maxRetries),
      headers: Object.entries(model.requestOptions?.headers ?? {}).map(
        ([key, value]) => ({ key, value }),
      ),
    },
    reasoningApiId: model.reasoningApiId ?? "",
  } satisfies AdvancedSettings;
}

function nullableObject<T extends Record<string, unknown>>(value: T) {
  return Object.values(value).some((item) => item !== undefined && item !== "")
    ? value
    : null;
}

function getAdvancedPayload(settings: AdvancedSettings) {
  const headers = Object.fromEntries(
    settings.requestOptions.headers
      .filter((header) => header.key.trim() || header.value.trim())
      .map((header) => [header.key.trim(), header.value.trim()]),
  );
  const stop = settings.defaultParameters.stop
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    architecture: nullableObject({
      inputModalities: settings.architecture.inputModalities.length
        ? settings.architecture.inputModalities
        : undefined,
      outputModalities: settings.architecture.outputModalities.length
        ? settings.architecture.outputModalities
        : undefined,
      tokenizer: settings.architecture.tokenizer || undefined,
      instructType: settings.architecture.instructType || undefined,
    }),
    reasoning: nullableObject({
      effort: settings.reasoning.effort || undefined,
      maxTokens: optionalNumber(settings.reasoning.maxTokens),
      supportsToolUse: settings.reasoning.supportsToolUse,
      supportsComputerUse: settings.reasoning.supportsComputerUse,
    }),
    supportedParameters: settings.supportedParameters.length
      ? settings.supportedParameters
      : null,
    defaultParameters: nullableObject({
      temperature: optionalNumber(settings.defaultParameters.temperature),
      topP: optionalNumber(settings.defaultParameters.topP),
      topK: optionalNumber(settings.defaultParameters.topK),
      maxTokens: optionalNumber(settings.defaultParameters.maxTokens),
      frequencyPenalty: optionalNumber(
        settings.defaultParameters.frequencyPenalty,
      ),
      presencePenalty: optionalNumber(
        settings.defaultParameters.presencePenalty,
      ),
      repetitionPenalty: optionalNumber(
        settings.defaultParameters.repetitionPenalty,
      ),
      seed: optionalNumber(settings.defaultParameters.seed),
      stop: stop.length ? stop : undefined,
    }),
    perRequestLimits: nullableObject({
      maxInputTokens: optionalNumber(settings.perRequestLimits.maxInputTokens),
      maxOutputTokens: optionalNumber(
        settings.perRequestLimits.maxOutputTokens,
      ),
      rpm: optionalNumber(settings.perRequestLimits.rpm),
      tpm: optionalNumber(settings.perRequestLimits.tpm),
    }),
    pricing: nullableObject({
      input: optionalNumber(settings.pricing.input),
      output: optionalNumber(settings.pricing.output),
      cacheRead: optionalNumber(settings.pricing.cacheRead),
      image: optionalNumber(settings.pricing.image),
    }),
    requestOptions: nullableObject({
      timeoutMs: optionalNumber(settings.requestOptions.timeoutMs),
      maxRetries: optionalNumber(settings.requestOptions.maxRetries),
      headers: Object.keys(headers).length ? headers : undefined,
    }),
    reasoningApiId: settings.reasoningApiId || null,
  };
}

function getSavePayload(
  values: SettingsValues,
  aliases: string[],
  advancedSettings: AdvancedSettings,
) {
  return saveModelInputSchema.safeParse({
    ...values,
    aliases: aliases.map((value) => value.trim()).filter(Boolean),
    ...getAdvancedPayload(advancedSettings),
  });
}

function getSettingsValues(model: ModelDetail): SettingsValues {
  return {
    id: model.id,
    providerId: model.providerId,
    modelId: model.modelId,
    enabled: model.enabled,
    expectedRevision: model.revision,
    displayName: model.displayName,
    family: model.family,
    description: model.description,
    contextLength: model.contextLength,
    maxCompletionTokens: model.maxCompletionTokens,
    knowledgeCutoff: model.knowledgeCutoff,
    expirationDate: model.expirationDate,
  };
}

export function ModelSettingsPage({
  activeTab,
  modelId,
  onTabChange,
  role,
}: ModelSettingsPageProps) {
  const queryClient = useQueryClient();
  const modelQuery = useQuery(modelAdminQueries.model(modelId));
  const providersQuery = useQuery(modelAdminQueries.providers());
  const [aliases, setAliases] = useState<string[]>([]);
  const [aliasDraft, setAliasDraft] = useState("");
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(
    emptyAdvancedSettings,
  );
  const [localActiveTab, setLocalActiveTab] =
    useState<ModelSettingsTab>("essential");
  const [isSettingsHydrated, setIsSettingsHydrated] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: modelQuery.data
      ? getSettingsValues(modelQuery.data)
      : undefined,
  });
  const watchedValues = useWatch({ control: form.control }) as SettingsValues;
  useEffect(() => {
    if (!modelQuery.data) {
      setIsSettingsHydrated(false);
      return;
    }
    const model = modelQuery.data;
    form.reset(getSettingsValues(model));
    setAliases(model.aliases.map((alias) => alias.alias));
    setAdvancedSettings(getAdvancedSettings(model));
    setIsSettingsHydrated(true);
  }, [form, modelQuery.data]);
  const saveMutation = useMutation({
    mutationFn: async (values: SettingsValues) => {
      const payload = getSavePayload(values, aliases, advancedSettings);
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
          ? `${conflict.message ?? "Conflict"} Reload to use the latest changes.`
          : (conflict.message ?? "Could not save model"),
      );
    },
  });
  const toggleMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      providerId: string;
      enabled: boolean;
      revision: number;
    }) => {
      const result = await toggleModel({
        data: {
          id: input.id,
          enabled: input.enabled,
          expectedRevision: input.revision,
        },
      });
      if (!result.ok) throw result.error;
      return input;
    },
    onSuccess: async (input) => {
      await invalidateModelAdmin.model(queryClient, input);
      setError("");
    },
    onError: (reason) =>
      setError(
        reason instanceof Error ? reason.message : "Could not update model",
      ),
  });
  const deleteMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      providerId: string;
      revision: number;
    }) => {
      const result = await deleteModel({
        data: { id: input.id, expectedRevision: input.revision },
      });
      if (!result.ok) throw result.error;
      return input;
    },
    onSuccess: async (input) => {
      await invalidateModelAdmin.model(queryClient, input);
      setConfirmDelete(false);
    },
    onError: (reason) =>
      setError(
        reason instanceof Error ? reason.message : "Could not delete model",
      ),
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
  const selectedTab = activeTab ?? localActiveTab;
  const currentPayload = getSavePayload(
    watchedValues,
    aliases,
    advancedSettings,
  );
  const initialPayload = getSavePayload(
    getSettingsValues(model),
    model.aliases.map((alias) => alias.alias),
    getAdvancedSettings(model),
  );
  const hasModelSchemaChanges =
    currentPayload.success &&
    initialPayload.success &&
    JSON.stringify(currentPayload.data) !== JSON.stringify(initialPayload.data);
  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/models">Models</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {toUsableModelId(model.providerName, model.modelId)}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <PageHeader
          title={`${model.providerName}/${model.displayName?.trim() || model.modelId}`}
          subtitle={
            <span className="mt-1 flex flex-col items-start gap-1">
              <CopyableIdentifier
                label="usable model ID"
                value={toUsableModelId(model.providerName, model.modelId)}
              />
              <CopyableIdentifier label="model UUID" value={model.id} />
            </span>
          }
        />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex flex-col items-start gap-1.5">
            <span>Settings</span>
            {role === "admin" ? (
              <div className="flex items-center gap-2">
                <Switch
                  checked={model.enabled}
                  disabled={toggleMutation.isPending}
                  id="model-enabled"
                  onCheckedChange={(enabled) =>
                    toggleMutation.mutate({
                      id: model.id,
                      providerId: model.providerId,
                      revision: model.revision,
                      enabled,
                    })
                  }
                />
                <FieldLabel htmlFor="model-enabled" className="font-normal">
                  Model enabled
                </FieldLabel>
              </div>
            ) : null}
          </CardTitle>
          {role === "admin" ? (
            <CardAction className="flex flex-wrap justify-end gap-2">
              <Button
                disabled={
                  saveMutation.isPending ||
                  !isSettingsHydrated ||
                  !hasModelSchemaChanges
                }
                form="model-settings-form"
                type="submit"
              >
                {saveMutation.isPending ? "Saving…" : "Save settings"}
              </Button>
              <Button
                disabled={deleteMutation.isPending}
                onClick={() => setConfirmDelete(true)}
                type="button"
                variant="destructive"
              >
                Delete model
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          <form
            id="model-settings-form"
            noValidate
            onSubmit={form.handleSubmit((values) =>
              saveMutation.mutate(values),
            )}
            className="pb-4"
          >
            <Tabs
              className="gap-1"
              value={selectedTab}
              onValueChange={(value) => {
                if (!modelSettingsTabs.includes(value as ModelSettingsTab)) {
                  return;
                }

                const nextTab = value as ModelSettingsTab;
                if (onTabChange) {
                  onTabChange(nextTab);
                  return;
                }
                setLocalActiveTab(nextTab);
              }}
            >
              <TabsList
                className="w-full max-w-full justify-start overflow-x-auto overflow-y-hidden"
                variant="line"
              >
                <TabsTrigger className="shrink-0 flex-none" value="essential">
                  Essencial
                </TabsTrigger>
                <TabsTrigger
                  className="shrink-0 flex-none"
                  value="capabilities"
                >
                  Capacidades
                </TabsTrigger>
                <TabsTrigger className="shrink-0 flex-none" value="aliases">
                  Aliases
                </TabsTrigger>
              </TabsList>
              <TabsContent value="essential" className="pt-3">
                <div className="grid gap-4 md:grid-cols-2">
                  {role === "admin" ? (
                    <Controller
                      control={form.control}
                      name="providerId"
                      render={({ field, fieldState }) => {
                        const providers =
                          (providersQuery.data as
                            | ProviderPublic[]
                            | undefined) ?? [];
                        return (
                          <Field>
                            <FieldLabel htmlFor={field.name}>
                              Provider
                            </FieldLabel>
                            <Select
                              items={Object.fromEntries([
                                ["none", "Choose a provider"],
                                ...providers.map((provider) => [
                                  provider.id,
                                  provider.name,
                                ]),
                              ])}
                              value={field.value || "none"}
                              onValueChange={(value) =>
                                field.onChange(
                                  value === "none" ? "" : (value ?? ""),
                                )
                              }
                              disabled={
                                providersQuery.isPending ||
                                providersQuery.isError
                              }
                            >
                              <SelectTrigger
                                id={field.name}
                                className="w-full"
                                aria-invalid={fieldState.invalid}
                              >
                                <SelectValue placeholder="Choose a provider" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  Choose a provider
                                </SelectItem>
                                {providers.map((provider) => (
                                  <SelectItem
                                    key={provider.id}
                                    value={provider.id}
                                  >
                                    {provider.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        );
                      }}
                    />
                  ) : (
                    <ReadonlyInput
                      id="providerId"
                      label="Provider"
                      value={model.providerName}
                    />
                  )}
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
                    name="contextLength"
                    render={({ field, fieldState }) => (
                      <NumberField
                        field={field}
                        label="Context length"
                        disabled={role !== "admin"}
                        state={fieldState}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="maxCompletionTokens"
                    render={({ field, fieldState }) => (
                      <NumberField
                        field={field}
                        label="Max completion tokens"
                        disabled={role !== "admin"}
                        state={fieldState}
                      />
                    )}
                  />
                  <PricingFields
                    disabled={role !== "admin"}
                    pricing={advancedSettings.pricing}
                    onChange={(pricing) =>
                      setAdvancedSettings((settings) => ({
                        ...settings,
                        pricing,
                      }))
                    }
                  />
                  <Controller
                    control={form.control}
                    name="knowledgeCutoff"
                    render={({ field, fieldState }) => (
                      <DateField
                        field={field}
                        state={fieldState}
                        label="Knowledge cutoff"
                        disabled={role !== "admin"}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="expirationDate"
                    render={({ field, fieldState }) => (
                      <DateField
                        field={field}
                        state={fieldState}
                        label="Expiration date"
                        disabled={role !== "admin"}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor={field.name}>
                          Description
                        </FieldLabel>
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
                </div>
              </TabsContent>
              <TabsContent value="capabilities" className="pt-3">
                <AdvancedSettingsFields
                  disabled={role !== "admin"}
                  sections={[
                    "architecture",
                    "reasoning",
                    "limits",
                    "parameters",
                  ]}
                  settings={advancedSettings}
                  onChange={setAdvancedSettings}
                />
              </TabsContent>
              <TabsContent value="aliases" className="pt-3">
                <Field>
                  <FieldLabel>Aliases</FieldLabel>
                  <FieldDescription>
                    Names alternativos aceitos no roteamento para este modelo.
                  </FieldDescription>
                  {aliases.length ? (
                    <div className="space-y-2">
                      {aliases.map((alias, index) => (
                        <div
                          className="flex flex-col gap-2 sm:flex-row"
                          key={`${alias}-${index}`}
                        >
                          <Input
                            aria-label={`Alias ${index + 1}`}
                            disabled={role !== "admin"}
                            onChange={(event) =>
                              setAliases((current) =>
                                current.map((value, itemIndex) =>
                                  itemIndex === index
                                    ? event.target.value
                                    : value,
                                ),
                              )
                            }
                            value={alias}
                          />
                          {role === "admin" ? (
                            <Button
                              onClick={() =>
                                setAliases((current) =>
                                  current.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                )
                              }
                              type="button"
                              variant="outline"
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Nenhum alias configurado.
                    </p>
                  )}
                  {role === "admin" ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        aria-label="New alias"
                        onChange={(event) => setAliasDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return;
                          event.preventDefault();
                          const alias = aliasDraft.trim();
                          if (!alias) return;
                          setAliases((current) => [...current, alias]);
                          setAliasDraft("");
                        }}
                        placeholder="Add an alias"
                        value={aliasDraft}
                      />
                      <Button
                        disabled={!aliasDraft.trim()}
                        onClick={() => {
                          const alias = aliasDraft.trim();
                          if (!alias) return;
                          setAliases((current) => [...current, alias]);
                          setAliasDraft("");
                        }}
                        type="button"
                        variant="secondary"
                      >
                        Add alias
                      </Button>
                    </div>
                  ) : null}
                </Field>
              </TabsContent>
            </Tabs>
          </form>
        </CardContent>
      </Card>
      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setConfirmDelete(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete model?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {model.providerName}/{model.modelId}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteMutation.mutate({
                  id: model.id,
                  providerId: model.providerId,
                  revision: model.revision,
                })
              }
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete model"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function ReadonlyInput({
  id,
  label,
  value,
}: {
  id?: string;
  label: string;
  value: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} value={value} disabled readOnly />
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

function NumberField({
  disabled,
  field,
  label,
  state,
}: {
  disabled: boolean;
  field: {
    name: string;
    value?: number | null;
    onChange: (value: number | null) => void;
  };
  label: string;
  state: { invalid: boolean; error?: { message?: string } };
}) {
  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        type="number"
        value={field.value ?? ""}
        disabled={disabled}
        onChange={(event) =>
          field.onChange(
            event.target.value === "" ? null : Number(event.target.value),
          )
        }
        aria-invalid={state.invalid}
      />
      <FieldError errors={[state.error]} />
    </Field>
  );
}

function DateField({
  disabled,
  field,
  label,
  state,
}: {
  disabled: boolean;
  field: {
    name: string;
    value?: string | null;
    onChange: (value: string | null) => void;
  };
  label: string;
  state: { invalid: boolean; error?: { message?: string } };
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateValue(field.value);

  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          aria-label={label}
          aria-invalid={state.invalid}
          disabled={disabled}
          render={
            <Button
              className="w-full justify-start font-normal"
              id={field.name}
              type="button"
              variant="outline"
            />
          }
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Select date"}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            locale={ptBR}
            mode="single"
            onSelect={(date) => {
              field.onChange(date ? format(date, "yyyy-MM-dd") : null);
              setOpen(false);
            }}
            selected={selectedDate}
          />
          {selectedDate ? (
            <div className="border-t p-2">
              <Button
                className="w-full"
                onClick={() => {
                  field.onChange(null);
                  setOpen(false);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                Clear date
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
      <FieldError errors={[state.error]} />
    </Field>
  );
}

function parseDateValue(value: string | null | undefined) {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

function PricingFields({
  disabled,
  onChange,
  pricing,
}: {
  disabled: boolean;
  onChange: (pricing: AdvancedSettings["pricing"]) => void;
  pricing: AdvancedSettings["pricing"];
}) {
  const updatePrice = (key: keyof AdvancedSettings["pricing"], value: string) =>
    onChange({ ...pricing, [key]: value });

  return (
    <>
      <InputField
        disabled={disabled}
        id="pricing-input"
        label="Input price"
        type="number"
        value={pricing.input}
        onChange={(input) => updatePrice("input", input)}
      />
      <InputField
        disabled={disabled}
        id="pricing-output"
        label="Output price"
        type="number"
        value={pricing.output}
        onChange={(output) => updatePrice("output", output)}
      />
      <InputField
        disabled={disabled}
        id="pricing-cache-read"
        label="Cache read price"
        type="number"
        value={pricing.cacheRead}
        onChange={(cacheRead) => updatePrice("cacheRead", cacheRead)}
      />
      <InputField
        disabled={disabled}
        id="pricing-image"
        label="Image price"
        type="number"
        value={pricing.image}
        onChange={(image) => updatePrice("image", image)}
      />
    </>
  );
}

function AdvancedSettingsFields({
  disabled,
  onChange,
  sections,
  settings,
}: {
  disabled: boolean;
  onChange: (settings: AdvancedSettings) => void;
  sections: AdvancedSection[];
  settings: AdvancedSettings;
}) {
  const update = <K extends keyof AdvancedSettings>(
    key: K,
    value: AdvancedSettings[K],
  ) => onChange({ ...settings, [key]: value });
  const updateArchitecture = (
    key: keyof AdvancedSettings["architecture"],
    value: string | string[],
  ) => update("architecture", { ...settings.architecture, [key]: value });
  const updateReasoning = (
    key: keyof AdvancedSettings["reasoning"],
    value: boolean | string | undefined,
  ) => update("reasoning", { ...settings.reasoning, [key]: value });
  const updateDefaults = (
    key: keyof AdvancedSettings["defaultParameters"],
    value: string,
  ) =>
    update("defaultParameters", {
      ...settings.defaultParameters,
      [key]: value,
    });
  const updateLimits = (
    key: keyof AdvancedSettings["perRequestLimits"],
    value: string,
  ) =>
    update("perRequestLimits", { ...settings.perRequestLimits, [key]: value });
  const updateRequestOptions = (
    key: "timeoutMs" | "maxRetries",
    value: string,
  ) => update("requestOptions", { ...settings.requestOptions, [key]: value });
  const hasSection = (section: AdvancedSection) => sections.includes(section);

  return (
    <Accordion className="-mt-2" defaultValue={sections} multiple>
      {hasSection("architecture") ? (
        <AccordionItem value="architecture">
          <AccordionTrigger className="py-3 text-base">
            Architecture
          </AccordionTrigger>
          <AccordionContent className="grid gap-4 pb-1 pt-2 md:grid-cols-2">
            <OptionChecklist
              control="switch"
              disabled={disabled}
              label="Input modalities"
              options={inputModalityOptions}
              selected={settings.architecture.inputModalities}
              onChange={(inputModalities) =>
                updateArchitecture("inputModalities", inputModalities)
              }
            />
            <OptionChecklist
              control="switch"
              disabled={disabled}
              label="Output modalities"
              options={outputModalityOptions}
              selected={settings.architecture.outputModalities}
              onChange={(outputModalities) =>
                updateArchitecture("outputModalities", outputModalities)
              }
            />
            <BooleanSelect
              disabled={disabled}
              id="reasoning-tool-use"
              label="Supports tool use"
              value={settings.reasoning.supportsToolUse}
              onChange={(supportsToolUse) =>
                updateReasoning("supportsToolUse", supportsToolUse)
              }
            />
            <BooleanSelect
              disabled={disabled}
              id="reasoning-computer-use"
              label="Supports computer use"
              value={settings.reasoning.supportsComputerUse}
              onChange={(supportsComputerUse) =>
                updateReasoning("supportsComputerUse", supportsComputerUse)
              }
            />
            <ArchitectureSelect
              disabled={disabled}
              id="architecture-tokenizer"
              label="Tokenizer"
              options={tokenizerOptions}
              value={settings.architecture.tokenizer}
              onChange={(tokenizer) =>
                updateArchitecture("tokenizer", tokenizer)
              }
            />
            <ArchitectureSelect
              disabled={disabled}
              id="architecture-instruct-type"
              label="Instruct type"
              options={instructTypeOptions}
              value={settings.architecture.instructType}
              onChange={(instructType) =>
                updateArchitecture("instructType", instructType)
              }
            />
            <InputField
              disabled={disabled}
              id="request-timeout"
              label="Timeout (ms)"
              type="number"
              value={settings.requestOptions.timeoutMs}
              onChange={(timeoutMs) =>
                updateRequestOptions("timeoutMs", timeoutMs)
              }
            />
            <InputField
              disabled={disabled}
              id="request-retries"
              label="Max retries"
              type="number"
              value={settings.requestOptions.maxRetries}
              onChange={(maxRetries) =>
                updateRequestOptions("maxRetries", maxRetries)
              }
            />
            <Field className="md:col-span-2">
              <FieldLabel>Request headers</FieldLabel>
              <div className="space-y-2">
                {settings.requestOptions.headers.map((header, index) => (
                  <div className="flex gap-2" key={`${header.key}-${index}`}>
                    <Input
                      aria-label={`Header ${index + 1} name`}
                      disabled={disabled}
                      placeholder="Header name"
                      value={header.key}
                      onChange={(event) => {
                        const headers = [...settings.requestOptions.headers];
                        headers[index] = { ...header, key: event.target.value };
                        update("requestOptions", {
                          ...settings.requestOptions,
                          headers,
                        });
                      }}
                    />
                    <Input
                      aria-label={`Header ${index + 1} value`}
                      disabled={disabled}
                      placeholder="Value"
                      value={header.value}
                      onChange={(event) => {
                        const headers = [...settings.requestOptions.headers];
                        headers[index] = {
                          ...header,
                          value: event.target.value,
                        };
                        update("requestOptions", {
                          ...settings.requestOptions,
                          headers,
                        });
                      }}
                    />
                    <Button
                      disabled={disabled}
                      onClick={() =>
                        update("requestOptions", {
                          ...settings.requestOptions,
                          headers: settings.requestOptions.headers.filter(
                            (_, headerIndex) => headerIndex !== index,
                          ),
                        })
                      }
                      type="button"
                      variant="outline"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  disabled={disabled}
                  onClick={() =>
                    update("requestOptions", {
                      ...settings.requestOptions,
                      headers: [
                        ...settings.requestOptions.headers,
                        { key: "", value: "" },
                      ],
                    })
                  }
                  type="button"
                  variant="outline"
                >
                  Add header
                </Button>
              </div>
            </Field>
          </AccordionContent>
        </AccordionItem>
      ) : null}
      {hasSection("reasoning") ? (
        <AccordionItem value="reasoning">
          <AccordionTrigger className="py-3 text-base">
            Reasoning
          </AccordionTrigger>
          <AccordionContent className="grid gap-4 pb-1 pt-2 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="reasoning-effort">Effort</FieldLabel>
              <Select
                items={{
                  unset: "Not specified",
                  ...Object.fromEntries(
                    reasoningEffortOptions.map((effort) => [effort, effort]),
                  ),
                }}
                value={settings.reasoning.effort || "unset"}
                onValueChange={(value) =>
                  updateReasoning(
                    "effort",
                    value === "unset" ? "" : (value ?? ""),
                  )
                }
                disabled={disabled}
              >
                <SelectTrigger id="reasoning-effort" className="w-full">
                  <SelectValue placeholder="Not specified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Not specified</SelectItem>
                  {reasoningEffortOptions.map((effort) => (
                    <SelectItem key={effort} value={effort}>
                      {effort}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <InputField
              disabled={disabled}
              id="reasoning-max-tokens"
              label="Max reasoning tokens"
              type="number"
              value={settings.reasoning.maxTokens}
              onChange={(maxTokens) => updateReasoning("maxTokens", maxTokens)}
            />
            <InputField
              disabled={disabled}
              id="reasoning-api-id"
              label="Reasoning API model ID"
              value={settings.reasoningApiId}
              onChange={(reasoningApiId) =>
                update("reasoningApiId", reasoningApiId)
              }
            />
          </AccordionContent>
        </AccordionItem>
      ) : null}
      {hasSection("limits") ? (
        <AccordionItem value="limits">
          <AccordionTrigger className="py-3 text-base">
            Per-request limits
          </AccordionTrigger>
          <AccordionContent className="grid gap-4 pb-1 pt-2 md:grid-cols-2">
            <InputField
              disabled={disabled}
              id="limit-max-input-tokens"
              label="Max input tokens"
              type="number"
              value={settings.perRequestLimits.maxInputTokens}
              onChange={(maxInputTokens) =>
                updateLimits("maxInputTokens", maxInputTokens)
              }
            />
            <InputField
              disabled={disabled}
              id="limit-max-output-tokens"
              label="Max output tokens"
              type="number"
              value={settings.perRequestLimits.maxOutputTokens}
              onChange={(maxOutputTokens) =>
                updateLimits("maxOutputTokens", maxOutputTokens)
              }
            />
            <InputField
              disabled={disabled}
              id="limit-rpm"
              label="Requests per minute"
              type="number"
              value={settings.perRequestLimits.rpm}
              onChange={(rpm) => updateLimits("rpm", rpm)}
            />
            <InputField
              disabled={disabled}
              id="limit-tpm"
              label="Tokens per minute"
              type="number"
              value={settings.perRequestLimits.tpm}
              onChange={(tpm) => updateLimits("tpm", tpm)}
            />
          </AccordionContent>
        </AccordionItem>
      ) : null}
      {hasSection("parameters") ? (
        <AccordionItem value="parameters">
          <AccordionTrigger className="py-3 text-base">
            Parameters
          </AccordionTrigger>
          <AccordionContent className="grid gap-4 pb-1 pt-2 md:grid-cols-2">
            <OptionChecklist
              className="md:col-span-2"
              disabled={disabled}
              label="Supported parameters"
              options={supportedParameterOptions}
              selected={settings.supportedParameters}
              onChange={(supportedParameters) =>
                update("supportedParameters", supportedParameters)
              }
            />
            <InputField
              disabled={disabled}
              id="default-temperature"
              label="Default temperature"
              type="number"
              value={settings.defaultParameters.temperature}
              onChange={(temperature) =>
                updateDefaults("temperature", temperature)
              }
            />
            <InputField
              disabled={disabled}
              id="default-top-p"
              label="Default top P"
              type="number"
              value={settings.defaultParameters.topP}
              onChange={(topP) => updateDefaults("topP", topP)}
            />
            <InputField
              disabled={disabled}
              id="default-top-k"
              label="Default top K"
              type="number"
              value={settings.defaultParameters.topK}
              onChange={(topK) => updateDefaults("topK", topK)}
            />
            <InputField
              disabled={disabled}
              id="default-max-tokens"
              label="Default max tokens"
              type="number"
              value={settings.defaultParameters.maxTokens}
              onChange={(maxTokens) => updateDefaults("maxTokens", maxTokens)}
            />
            <InputField
              disabled={disabled}
              id="default-frequency-penalty"
              label="Default frequency penalty"
              type="number"
              value={settings.defaultParameters.frequencyPenalty}
              onChange={(frequencyPenalty) =>
                updateDefaults("frequencyPenalty", frequencyPenalty)
              }
            />
            <InputField
              disabled={disabled}
              id="default-presence-penalty"
              label="Default presence penalty"
              type="number"
              value={settings.defaultParameters.presencePenalty}
              onChange={(presencePenalty) =>
                updateDefaults("presencePenalty", presencePenalty)
              }
            />
            <InputField
              disabled={disabled}
              id="default-repetition-penalty"
              label="Default repetition penalty"
              type="number"
              value={settings.defaultParameters.repetitionPenalty}
              onChange={(repetitionPenalty) =>
                updateDefaults("repetitionPenalty", repetitionPenalty)
              }
            />
            <InputField
              disabled={disabled}
              id="default-seed"
              label="Default seed"
              type="number"
              value={settings.defaultParameters.seed}
              onChange={(seed) => updateDefaults("seed", seed)}
            />
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="default-stop">
                Stop sequences (one per line)
              </FieldLabel>
              <Textarea
                id="default-stop"
                className="min-h-24"
                disabled={disabled}
                value={settings.defaultParameters.stop}
                onChange={(event) => updateDefaults("stop", event.target.value)}
              />
            </Field>
          </AccordionContent>
        </AccordionItem>
      ) : null}
    </Accordion>
  );
}

function InputField({
  disabled,
  id,
  label,
  onChange,
  type = "text",
  value,
}: {
  disabled: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  type?: "number" | "text";
  value: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        disabled={disabled}
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function ArchitectureSelect({
  disabled,
  id,
  label,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  value: string;
}) {
  const values =
    value && !options.includes(value) ? [value, ...options] : options;

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        disabled={disabled}
        items={{
          unset: "Not specified",
          ...Object.fromEntries(values.map((option) => [option, option])),
        }}
        value={value || "unset"}
        onValueChange={(nextValue) =>
          onChange(nextValue === "unset" ? "" : (nextValue ?? ""))
        }
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Not specified" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">Not specified</SelectItem>
          {values.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function OptionChecklist({
  className,
  control = "checkbox",
  disabled,
  label,
  onChange,
  options,
  selected,
}: {
  className?: string;
  control?: "checkbox" | "switch";
  disabled: boolean;
  label: string;
  onChange: (selected: string[]) => void;
  options: readonly string[];
  selected: string[];
}) {
  return (
    <Field className={className}>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const id = `${label.toLowerCase().replaceAll(" ", "-")}-${option}`;
          const checked = selected.includes(option);
          return (
            <div className="flex items-center gap-2" key={option}>
              {control === "switch" ? (
                <Switch
                  checked={checked}
                  disabled={disabled}
                  id={id}
                  size="sm"
                  onCheckedChange={(nextChecked) =>
                    onChange(
                      nextChecked
                        ? [...selected, option]
                        : selected.filter((value) => value !== option),
                    )
                  }
                />
              ) : (
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  id={id}
                  onCheckedChange={(nextChecked) =>
                    onChange(
                      nextChecked
                        ? [...selected, option]
                        : selected.filter((value) => value !== option),
                    )
                  }
                />
              )}
              <FieldLabel htmlFor={id} className="font-normal">
                {option}
              </FieldLabel>
            </div>
          );
        })}
      </div>
    </Field>
  );
}

function BooleanSelect({
  disabled,
  id,
  label,
  onChange,
  value,
}: {
  disabled: boolean;
  id: string;
  label: string;
  onChange: (value: boolean | undefined) => void;
  value: boolean | undefined;
}) {
  const selected = value === undefined ? "unset" : value ? "true" : "false";
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        items={{ unset: "Not specified", true: "Yes", false: "No" }}
        value={selected}
        onValueChange={(nextValue) =>
          onChange(
            nextValue === "unset" || !nextValue
              ? undefined
              : nextValue === "true",
          )
        }
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Not specified" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">Not specified</SelectItem>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}
