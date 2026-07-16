import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type {
  ApplyDiscoverySelectionInput,
  ProbeModelInput,
} from "@/features/model-admin/contracts/model-admin";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

type DiscoveryItem = {
  modelId: string;
  displayName: string | null;
  status: "new" | "changed" | "unchanged" | "conflict";
  currentRevision?: number;
};

type DiscoveryPanelProps = Readonly<{
  providerId: string;
  disabled: boolean;
  discovery?: { models: DiscoveryItem[] };
  discovering: boolean;
  applying: boolean;
  probing: boolean;
  error?: string;
  syncResults?: Array<{
    modelId: string;
    status: "created" | "updated" | "unchanged" | "conflict";
    currentRevision?: number;
  }>;
  onDiscover: () => Promise<void>;
  onApply: (input: ApplyDiscoverySelectionInput) => Promise<void>;
  onProbe: (
    input: ProbeModelInput,
  ) => Promise<{ content: string; truncated: boolean }>;
}>;

const probeFormSchema = z.object({
  modelId: z.string().trim().min(1, "Informe o modelo."),
  prompt: z
    .string()
    .trim()
    .min(1, "Informe um prompt.")
    .refine(
      (value) => [...value].length <= 1024,
      "O prompt aceita até 1.024 caracteres.",
    ),
});

type ProbeFormValues = z.infer<typeof probeFormSchema>;

export function DiscoveryPanel({
  providerId,
  disabled,
  discovery,
  discovering,
  applying,
  probing,
  error,
  syncResults,
  onDiscover,
  onApply,
  onProbe,
}: DiscoveryPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [probeResult, setProbeResult] = useState<{
    content: string;
    truncated: boolean;
  }>();
  const probeForm = useForm<ProbeFormValues>({
    resolver: zodResolver(probeFormSchema),
    defaultValues: { modelId: "", prompt: "" },
  });

  useEffect(() => {
    setSelected(
      new Set(
        discovery?.models
          .filter((item) => item.status === "new" || item.status === "changed")
          .map((item) => item.modelId) ?? [],
      ),
    );
  }, [discovery]);

  const selectedItems =
    discovery?.models.filter((item) => selected.has(item.modelId)) ?? [];

  const apply = async () => {
    await onApply({
      providerId,
      items: selectedItems.map((item) => ({
        modelId: item.modelId,
        displayName: item.displayName,
        enabled: true,
        expectedRevision: item.currentRevision,
      })),
    });
  };

  const submitProbe = async (values: ProbeFormValues) => {
    setProbeResult(
      await onProbe({
        providerId,
        modelId: values.modelId.trim(),
        prompt: values.prompt.trim(),
      }),
    );
    probeForm.reset({ modelId: values.modelId.trim(), prompt: "" });
  };

  return (
    <section
      aria-label="Discovery e probe"
      className="space-y-4 rounded-lg border border-border p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-medium">Discovery e sincronização</h3>
          <p className="text-sm text-muted-foreground">
            A descoberta e o probe são executados no servidor.
          </p>
        </div>
        <Button
          disabled={disabled || discovering}
          onClick={() => void onDiscover()}
          type="button"
        >
          {discovering ? "Descobrindo…" : "Descobrir modelos"}
        </Button>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {discovery ? (
        discovery.models.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum modelo foi encontrado para este provider.
          </p>
        ) : (
          <div className="space-y-2">
            {discovery.models.map((item) => {
              const selectable =
                item.status === "new" || item.status === "changed";
              return (
                <label
                  className="flex items-center gap-2 text-sm"
                  key={item.modelId}
                >
                  <Checkbox
                    checked={selected.has(item.modelId)}
                    disabled={disabled || !selectable || applying}
                    onCheckedChange={(checked) => {
                      setSelected((current) => {
                        const next = new Set(current);
                        if (checked === true) next.add(item.modelId);
                        else next.delete(item.modelId);
                        return next;
                      });
                    }}
                    aria-label={`Select ${item.displayName ?? item.modelId}`}
                  />
                  <span>{item.displayName ?? item.modelId}</span>
                  <Badge
                    variant={
                      item.status === "conflict" ? "destructive" : "outline"
                    }
                  >
                    {item.status}
                  </Badge>
                </label>
              );
            })}
            <Button
              disabled={disabled || applying || selectedItems.length === 0}
              onClick={() => void apply()}
              type="button"
            >
              {applying
                ? "Sincronizando…"
                : `Sincronizar ${selectedItems.length} selecionado(s)`}
            </Button>
          </div>
        )
      ) : null}
      {syncResults?.length ? (
        <section
          aria-label="Resultado da sincronização"
          className="space-y-1 text-sm"
        >
          <h4 className="font-medium">Resultado da sincronização</h4>
          {syncResults.map((item) => (
            <p key={item.modelId}>
              {item.modelId}: {item.status}
              {item.status === "conflict"
                ? " (atualize para tentar novamente)"
                : ""}
            </p>
          ))}
        </section>
      ) : null}
      <form
        className="grid gap-3 border-t border-border pt-4"
        noValidate
        onSubmit={probeForm.handleSubmit(submitProbe)}
      >
        <h3 className="font-medium">Probe de modelo</h3>
        <Controller
          control={probeForm.control}
          name="modelId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`probe-${field.name}`}>Modelo</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                disabled={disabled || probing}
                id={`probe-${field.name}`}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={probeForm.control}
          name="prompt"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`probe-${field.name}`}>Prompt</FieldLabel>
              <Textarea
                {...field}
                aria-invalid={fieldState.invalid}
                className="min-h-20"
                disabled={disabled || probing}
                id={`probe-${field.name}`}
                maxLength={1024}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Button disabled={disabled || probing} type="submit">
          {probing ? "Testando…" : "Executar probe"}
        </Button>
      </form>
      {probeResult ? (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium">
            Resposta{probeResult.truncated ? " (truncada)" : ""}
          </p>
          <pre className="mt-2 whitespace-pre-wrap break-words font-sans">
            {probeResult.content}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
