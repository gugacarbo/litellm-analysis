// biome-ignore lint/nursery/noExcessiveLinesPerFile: The provider form keeps its validation, credential lifecycle, and fields together to prevent plaintext from crossing component boundaries.
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type {
  CreateProviderInput,
  TestProviderConnectionInput,
  UpdateProviderInput,
} from "@/features/model-admin/contracts/model-admin";
import { testProviderConnectionInputSchema } from "@/features/model-admin/contracts/model-admin";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const providerFormSchema = z
  .object({
    name: z.string().trim().min(1, "Nome é obrigatório."),
    provider: z.string().trim().min(1, "Informe o adapter."),
    baseUrl: z.union([
      z.string().trim().url("Informe uma URL válida."),
      z.literal(""),
    ]),
    credentialAction: z.enum(["preserve", "replace", "remove"]),
    credentialValue: z.string(),
  })
  .superRefine((value, context) => {
    if (value.credentialAction === "replace" && !value.credentialValue.trim()) {
      context.addIssue({
        code: "custom",
        message: "Informe uma credencial para substituir.",
        path: ["credentialValue"],
      });
    }
  });

type ProviderFormValues = z.infer<typeof providerFormSchema>;

const adapterOptions = [
  { value: "openai-compatible", label: "OpenAI-compatible" },
  { value: "ollama", label: "Ollama (sem credencial)" },
] as const;

type ProviderFormProps = Readonly<{
  initial?: {
    id: string;
    name: string;
    provider: string | null;
    baseUrl: string | null;
    revision: number;
    hasStoredSecret: boolean;
  };
  disabled?: boolean;
  busy?: boolean;
  testing?: boolean;
  framed?: boolean;
  showTitle?: boolean;
  onCancel?: () => void;
  onTest?: (input: TestProviderConnectionInput) => Promise<{ message: string }>;
  onSubmit: (input: CreateProviderInput | UpdateProviderInput) => Promise<void>;
}>;

function toNullable(value: string): string | null {
  return value.trim() || null;
}

export function ProviderForm({
  initial,
  disabled = false,
  busy = false,
  testing = false,
  framed = true,
  showTitle = true,
  onCancel,
  onTest,
  onSubmit,
}: ProviderFormProps) {
  const [testFeedback, setTestFeedback] = useState<
    { message: string; variant: "error" | "success" } | undefined
  >();
  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      provider: initial?.provider ?? "",
      baseUrl: initial?.baseUrl ?? "",
      // A stored credential is intentionally represented only by its state.
      // The form never receives an old value to pre-populate this field.
      credentialAction: initial ? "preserve" : "replace",
      credentialValue: "",
    },
  });
  const action = form.watch("credentialAction");
  const isDisabled = disabled || busy || testing;

  const testConnection = async () => {
    if (!onTest) return;
    const values = form.getValues();
    const parsed = testProviderConnectionInputSchema.safeParse({
      provider: values.provider.trim(),
      baseUrl: values.baseUrl.trim(),
      ...(values.credentialAction === "replace"
        ? { credential: values.credentialValue.trim() }
        : {}),
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.path[0] === "provider") {
        form.setError("provider", { message: issue.message });
      } else if (issue?.path[0] === "baseUrl") {
        form.setError("baseUrl", { message: issue.message });
      } else if (issue?.path[0] === "credential") {
        form.setError("credentialValue", { message: issue.message });
      }
      setTestFeedback({
        variant: "error",
        message: "Preencha os dados necessários para testar a conexão.",
      });
      return;
    }

    setTestFeedback(undefined);
    try {
      const result = await onTest(parsed.data);
      setTestFeedback({ variant: "success", message: result.message });
    } catch (error) {
      setTestFeedback({
        variant: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível testar a conexão.",
      });
    }
  };

  const submit = async (values: ProviderFormValues) => {
    const credential =
      values.credentialAction === "replace"
        ? { kind: "replace" as const, value: values.credentialValue.trim() }
        : values.credentialAction === "remove"
          ? { kind: "remove" as const }
          : { kind: "preserve" as const };

    if (initial) {
      await onSubmit({
        id: initial.id,
        expectedRevision: initial.revision,
        name: values.name.trim(),
        provider: values.provider.trim(),
        baseUrl: toNullable(values.baseUrl),
        credential,
      });
    } else {
      await onSubmit({
        name: values.name.trim(),
        provider: values.provider.trim(),
        baseUrl: toNullable(values.baseUrl),
        credential:
          credential.kind === "preserve" ? { kind: "remove" } : credential,
      });
    }

    // Do not retain submitted plaintext after the request resolves.
    form.setValue("credentialValue", "");
    if (initial) form.setValue("credentialAction", "preserve");
  };

  return (
    <form
      className={
        framed ? "grid gap-4 rounded-lg border border-border p-4" : "grid gap-4"
      }
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      <div>
        {showTitle ? (
          <h3 className="font-medium">
            {initial ? "Editar provider" : "Novo provider"}
          </h3>
        ) : null}
        {initial?.hasStoredSecret ? (
          <p className="text-sm text-muted-foreground">
            Credencial configurada. Ela não pode ser exibida novamente.
          </p>
        ) : null}
      </div>
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              disabled={isDisabled}
              id={field.name}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="provider"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Adapter</FieldLabel>
            <Select
              disabled={isDisabled}
              value={field.value || null}
              onValueChange={(value) => field.onChange(value ?? "")}
            >
              <SelectTrigger
                id={field.name}
                aria-invalid={fieldState.invalid}
                aria-label="Adapter"
                className="w-full"
              >
                <SelectValue placeholder="Selecione um adapter" />
              </SelectTrigger>
              <SelectContent>
                {initial?.provider &&
                !adapterOptions.some(
                  (option) => option.value === initial.provider,
                ) ? (
                  <SelectItem value={initial.provider}>
                    {initial.provider} (atual)
                  </SelectItem>
                ) : null}
                {adapterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="baseUrl"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Base URL</FieldLabel>
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              disabled={isDisabled}
              id={field.name}
              placeholder="https://api.example.com/v1"
              type="url"
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="credentialAction"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Credencial</FieldLabel>
            <Select
              disabled={isDisabled}
              value={field.value}
              onValueChange={(value) => {
                if (value) field.onChange(value);
              }}
              items={{
                ...(initial ? { preserve: "Preservar a atual" } : {}),
                replace: initial ? "Substituir" : "Adicionar",
                remove: "Remover / não configurar",
              }}
            >
              <SelectTrigger id={field.name} aria-label="Ação da credencial">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {initial ? (
                  <SelectItem value="preserve">Preservar a atual</SelectItem>
                ) : null}
                <SelectItem value="replace">
                  {initial ? "Substituir" : "Adicionar"}
                </SelectItem>
                <SelectItem value="remove">Remover / não configurar</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      />
      {action === "replace" ? (
        <Controller
          control={form.control}
          name="credentialValue"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Nova credencial</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="new-password"
                disabled={isDisabled}
                id={field.name}
                type="password"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      ) : null}
      {testFeedback ? (
        <p
          className={
            testFeedback.variant === "success"
              ? "text-sm text-emerald-600 dark:text-emerald-400"
              : "text-destructive text-sm"
          }
          role="status"
        >
          {testFeedback.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {onTest ? (
          <Button
            disabled={disabled || busy || testing}
            onClick={() => void testConnection()}
            type="button"
            variant="outline"
          >
            {testing ? "Testando conexão…" : "Testar conexão"}
          </Button>
        ) : null}
        <Button disabled={isDisabled} type="submit">
          {busy ? "Salvando…" : "Salvar provider"}
        </Button>
        {onCancel ? (
          <Button
            disabled={busy || testing}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
