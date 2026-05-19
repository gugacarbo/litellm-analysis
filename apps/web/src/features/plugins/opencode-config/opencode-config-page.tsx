import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Info,
  Server,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Slider } from "@/shared/components/ui/slider";

interface OpenCodeConfigPageProps {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  allModels: Record<string, unknown>;
  litellmProvider: { baseUrl: string; name: string };
}

interface ModelEntry {
  id: string;
  displayName?: string;
  enabled?: boolean;
}

export function OpenCodeConfigPage({
  config,
  onChange,
  allModels,
  litellmProvider,
}: OpenCodeConfigPageProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const schemaUrl = (config.$schema as string) ?? "";
  const defaultModel = (config.defaultModel as string) ?? "";
  const defaultTemperature = (config.defaultTemperature as number) ?? 0.2;

  const modelOptions = useMemo(() => {
    const entries = Object.entries(allModels ?? {}) as [string, ModelEntry][];
    return entries
      .filter(([, spec]) => spec.enabled !== false)
      .map(([key, spec]) => ({
        value: key,
        label: spec.displayName ?? key,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allModels]);

  const handleModelChange = useCallback(
    (value: string) => {
      onChange("defaultModel", value === "__none" ? "" : value);
    },
    [onChange],
  );

  const handleTempChange = useCallback(
    (values: number[]) => {
      onChange("defaultTemperature", values[0]);
    },
    [onChange],
  );

  const handleTempInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!Number.isNaN(val) && val >= 0 && val <= 2) {
        onChange("defaultTemperature", val);
      }
    },
    [onChange],
  );

  const handleSchemaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange("$schema", e.target.value);
    },
    [onChange],
  );

  const previewJson = useMemo(() => {
    const modelsSection: Record<string, unknown> = {};
    for (const [key, spec] of Object.entries(allModels ?? {})) {
      const modelSpec = spec as ModelEntry;
      if (modelSpec.enabled === false) continue;
      modelsSection[key] = {
        id: key,
        name: modelSpec.displayName ?? key,
      };
    }

    return {
      $schema: schemaUrl || "https://opencode.ai/config.json",
      provider: {
        litellm: {
          name: litellmProvider.name || "LiteLLM",
          npm: "@ai-sdk/openai-compatible",
          options: {
            baseURL: litellmProvider.baseUrl,
            apiKey: litellmProvider.baseUrl ? "{env:LITELLM_API_KEY}" : "",
          },
          models: modelsSection,
        },
      },
      ...(defaultModel || defaultTemperature
        ? {
            _defaults: {
              ...(defaultModel ? { defaultModel } : {}),
              ...(defaultTemperature ? { defaultTemperature } : {}),
            },
          }
        : {}),
    };
  }, [schemaUrl, allModels, litellmProvider, defaultModel, defaultTemperature]);

  const previewText = JSON.stringify(previewJson, null, 2);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(previewText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [previewText]);

  return (
    <div className="space-y-6">
      {/* Schema URL */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Schema</h3>
        <p className="text-sm text-muted-foreground">
          Official OpenCode config schema URL for validation.
        </p>
        <div className="flex gap-2">
          <Input
            value={schemaUrl}
            onChange={handleSchemaChange}
            placeholder="https://opencode.ai/config.json"
            className="font-mono text-xs"
          />
          <a
            href={schemaUrl || "https://opencode.ai/config.json"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Default Model */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Default Model</h3>
        <p className="text-sm text-muted-foreground">
          Model to use when a system agent has no model configured.
        </p>
        <Select
          value={defaultModel || "__none"}
          onValueChange={handleModelChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a model..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">
              <span className="text-muted-foreground">None (use agent id)</span>
            </SelectItem>
            {modelOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Temperature */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Default Temperature</h3>
        <p className="text-sm text-muted-foreground">
          Sampling temperature for agents without one configured.
        </p>
        <div className="flex items-center gap-4">
          <Slider
            value={[defaultTemperature]}
            min={0}
            max={2}
            step={0.1}
            onValueChange={handleTempChange}
            className="flex-1"
          />
          <Input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={defaultTemperature}
            onChange={handleTempInputChange}
            className="w-20 text-center"
          />
        </div>
      </div>

      {/* Provider Connection (read-only) */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-medium">
          <Server className="h-4 w-4 text-muted-foreground" />
          Provider Connection
        </h3>
        <p className="text-sm text-muted-foreground">
          LiteLLM provider settings from models configuration (read-only).
        </p>
        <div className="rounded-md border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">
              {litellmProvider.name || "Not configured"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Base URL</span>
            <span className="font-mono text-sm">
              {litellmProvider.baseUrl || "Not configured"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Info className="h-3 w-3" />
            Edit provider settings in the Models page
          </div>
        </div>
      </div>

      {/* Output Preview */}
      <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
        <div className="space-y-3">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {previewOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Output Preview
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="relative rounded-md border bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-7 w-7 p-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <pre className="max-h-80 overflow-auto p-4 text-xs font-mono">
                {previewText}
              </pre>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
