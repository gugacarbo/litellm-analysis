import { useCallback } from "react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface OpenCodeConfigPageProps {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function OpenCodeConfigPage({
  config,
  onChange,
}: OpenCodeConfigPageProps) {
  const defaultModel = (config.defaultModel as string) ?? "";
  const defaultTemperature = (config.defaultTemperature as number) ?? 0.2;

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange("defaultModel", e.target.value);
    },
    [onChange],
  );

  const handleTempChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange("defaultTemperature", Number(e.target.value));
    },
    [onChange],
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">OpenCode Configuration</h3>
      <p className="text-sm text-muted-foreground">
        Configure default settings for the OpenCode AI SDK plugin.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="defaultModel">Default Model</Label>
          <p className="text-xs text-muted-foreground">
            Model to use when a system agent has no model configured
          </p>
          <Input
            id="defaultModel"
            value={defaultModel}
            onChange={handleModelChange}
            placeholder="e.g. gpt-4"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultTemperature">Default Temperature</Label>
          <p className="text-xs text-muted-foreground">
            Default sampling temperature for agents without one configured
          </p>
          <Input
            id="defaultTemperature"
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={defaultTemperature}
            onChange={handleTempChange}
          />
        </div>
      </div>
    </div>
  );
}
