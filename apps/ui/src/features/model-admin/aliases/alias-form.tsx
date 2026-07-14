import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/shared/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";

const aliasFormSchema = z.object({
  alias: z.string().trim().min(1, "Alias is required."),
  targetModelId: z.uuid("Choose a target model."),
});

type AliasFormValues = z.infer<typeof aliasFormSchema>;

type AliasFormProps = Readonly<{
  alias: { alias: string; targetModelId: string };
  models: readonly {
    id: string;
    modelId: string;
    providerName: string;
  }[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: AliasFormValues) => Promise<void> | void;
}>;

export function AliasForm({
  alias,
  models,
  pending,
  onCancel,
  onSubmit,
}: AliasFormProps) {
  const form = useForm<AliasFormValues>({
    resolver: zodResolver(aliasFormSchema),
    values: { alias: alias.alias, targetModelId: alias.targetModelId },
  });
  const normalizedAlias = form.watch("alias").trim().toLocaleLowerCase();

  return (
    <form
      className="space-y-4 rounded-md border bg-muted/20 p-4"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Controller
        control={form.control}
        name="alias"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="alias">Alias</FieldLabel>
            <Input {...field} aria-invalid={fieldState.invalid} id="alias" />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <p className="text-xs text-muted-foreground">
        Normalized: {normalizedAlias || "—"}
      </p>
      <Controller
        control={form.control}
        name="targetModelId"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="target-model">Target model</FieldLabel>
            <Combobox
              items={models.map((model) => ({
                value: model.id,
                label: `${model.providerName} / ${model.modelId}`,
              }))}
              value={field.value}
              onValueChange={(value) => field.onChange(value ?? "")}
            >
              <ComboboxInput
                id="target-model"
                aria-invalid={fieldState.invalid}
                placeholder="Search target model..."
                showClear
              />
              <ComboboxContent>
                <ComboboxEmpty>No target model found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item.value}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <div className="flex gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving..." : "Save alias"}
        </Button>
        <Button
          disabled={pending}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
