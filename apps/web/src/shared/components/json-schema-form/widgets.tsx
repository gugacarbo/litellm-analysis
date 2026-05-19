import type { WidgetProps } from "@rjsf/utils";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";

export function StringWidget(props: WidgetProps) {
  const { id, value, required, label, onChange, schema, disabled } = props;
  const isLongText = (schema.description as string)?.length > 60;

  if (isLongText) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label as string}
          {required && <span className="text-destructive"> *</span>}
        </Label>
        <Textarea
          id={id}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={schema.default as string}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label as string}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={id}
        type={schema.format === "password" ? "password" : "text"}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={schema.default as string}
      />
    </div>
  );
}

export function NumberWidget(props: WidgetProps) {
  const { id, value, required, label, onChange, disabled, schema } = props;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label as string}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={id}
        type="number"
        value={(value as number) ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        min={schema.minimum as number}
        max={schema.maximum as number}
        step={schema.multipleOf ? Number(schema.multipleOf) : 0.1}
        placeholder={String(schema.default ?? "")}
      />
    </div>
  );
}

export function BooleanWidget(props: WidgetProps) {
  const { id, value, label, onChange, disabled } = props;

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={(value as boolean) ?? false}
        onCheckedChange={(checked) => onChange(checked)}
        disabled={disabled}
      />
      <Label htmlFor={id}>{label as string}</Label>
    </div>
  );
}

export function SelectWidget(props: WidgetProps) {
  const { id, value, required, label, onChange, schema, disabled } = props;
  const options = schema.enum as string[] | undefined;

  if (!options) {
    return <StringWidget {...props} />;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label as string}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Select
        value={(value as string) ?? ""}
        onValueChange={(v) => onChange(v)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
