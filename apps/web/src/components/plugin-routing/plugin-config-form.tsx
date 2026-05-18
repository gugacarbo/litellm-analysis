import type { ConfigField } from "@lite-llm/api-contracts/agent-catalog";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";

interface PluginConfigFormProps {
  schema: ConfigField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function PluginConfigForm({
  schema,
  values,
  onChange,
}: PluginConfigFormProps) {
  if (schema.length === 0) return null;

  const toggleMultiSelectItem = (fieldKey: string, itemValue: string) => {
    const current = ((values[fieldKey] as string[]) ?? []) as string[];
    const next = current.includes(itemValue)
      ? current.filter((v) => v !== itemValue)
      : [...current, itemValue];
    onChange(fieldKey, next);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Plugin Options</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {schema.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}
            {field.type === "string" || field.type === "password" ? (
              <Input
                id={field.key}
                type={field.type}
                placeholder={field.placeholder}
                value={
                  (values[field.key] as string) ??
                  (field.default as string) ??
                  ""
                }
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            ) : field.type === "number" ? (
              <Input
                id={field.key}
                type="number"
                value={
                  (values[field.key] as number) ??
                  (field.default as number) ??
                  ""
                }
                onChange={(e) => onChange(field.key, Number(e.target.value))}
              />
            ) : field.type === "boolean" ? (
              <div className="flex items-center gap-2">
                <Switch
                  id={field.key}
                  checked={
                    (values[field.key] as boolean) ??
                    (field.default as boolean) ??
                    false
                  }
                  onCheckedChange={(checked) => onChange(field.key, checked)}
                />
                <Label htmlFor={field.key}>Enabled</Label>
              </div>
            ) : field.type === "select" && field.options ? (
              <Select
                value={
                  (values[field.key] as string) ??
                  (field.default as string) ??
                  ""
                }
                onValueChange={(value) => onChange(field.key, value)}
              >
                <SelectTrigger id={field.key} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "multiselect" && field.options ? (
              <div className="space-y-2 rounded-md border p-3">
                {field.options.map((opt) => {
                  const selected = ((values[field.key] as string[]) ??
                    []) as string[];
                  const checked = selected.includes(opt.value);
                  return (
                    <div key={opt.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${field.key}-${opt.value}`}
                        checked={checked}
                        onCheckedChange={() =>
                          toggleMultiSelectItem(field.key, opt.value)
                        }
                      />
                      <Label
                        htmlFor={`${field.key}-${opt.value}`}
                        className="text-sm font-normal"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            ) : field.type === "switch-group" && field.options ? (
              <div className="space-y-2 rounded-md border p-3">
                {field.options.map((opt) => {
                  const selected = ((values[field.key] as string[]) ??
                    []) as string[];
                  const checked = selected.includes(opt.value);
                  return (
                    <div key={opt.value} className="flex items-center gap-2">
                      <Switch
                        id={`${field.key}-${opt.value}`}
                        checked={checked}
                        onCheckedChange={() =>
                          toggleMultiSelectItem(field.key, opt.value)
                        }
                      />
                      <Label
                        htmlFor={`${field.key}-${opt.value}`}
                        className="text-sm font-normal"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
