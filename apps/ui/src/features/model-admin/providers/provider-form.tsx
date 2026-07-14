import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type {
  CreateProviderInput,
  UpdateProviderInput,
} from "@/features/model-admin/contracts/model-admin";
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
  onSubmit: (input: CreateProviderInput | UpdateProviderInput) => Promise<void>;
}>;

function toNullable(value: string): string | null {
  return value.trim() || null;
}

export function ProviderForm({
  initial,
  disabled = false,
  busy = false,
  onSubmit,
}: ProviderFormProps) {
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
      className="grid gap-4 rounded-lg border border-border p-4"
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      <div>
        <h3 className="font-medium">
          {initial ? "Editar provider" : "Novo provider"}
        </h3>
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
              disabled={disabled || busy}
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
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              disabled={disabled || busy}
              id={field.name}
              placeholder="openai-compatible"
            />
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
              disabled={disabled || busy}
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
              disabled={disabled || busy}
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
                disabled={disabled || busy}
                id={field.name}
                type="password"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      ) : null}
      <Button disabled={disabled || busy} type="submit">
        {busy ? "Salvando…" : "Salvar provider"}
      </Button>
    </form>
  );
}
