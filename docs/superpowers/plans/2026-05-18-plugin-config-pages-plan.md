# Plugin Config Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a dedicated OpenCode config page with typed form fields and a generic JSON Schema-driven form for other plugins, using `@rjsf/core` + shadcn/ui.

**Architecture:** Server exposes JSON Schema per plugin via new endpoint. Frontend routes to OpenCode-specific page or generic RJSF form based on `pluginId`. All changes persist via existing `PUT /plugin-routing/:pluginId/config` API.

**Tech Stack:** TypeScript, React 19, Express, Zod, `zod-to-json-schema`, `@rjsf/core`, `@rjsf/validator-ajv8`, shadcn/ui

---

### Task 1: Add `zod-to-json-schema` dependency and export JSON Schema generation

**Files:**
- Modify: `repositories/agents-repository/package.json`
- Modify: `repositories/agents-repository/src/schemas/plugin-configs.ts`
- Modify: `repositories/agents-repository/src/schemas/index.ts`

- [ ] **Step 1: Add `zod-to-json-schema` dependency**

Run: `pnpm --filter @lite-llm/agents-repository add zod-to-json-schema`

- [ ] **Step 2: Add JSON Schema export function to `plugin-configs.ts`**

Add to `repositories/agents-repository/src/schemas/plugin-configs.ts` (at end of file):

```typescript
import { zodToJsonSchema } from "zod-to-json-schema";

/** JSON Schema for the OpenCode plugin config. */
export const openCodePluginJsonSchema = zodToJsonSchema(
  openCodePluginConfigSchema,
  "OpenCodePluginConfig",
);

/** JSON Schema for the OpenAgent plugin config. */
export const openAgentPluginJsonSchema = zodToJsonSchema(
  openAgentPluginConfigSchema,
  "OpenAgentPluginConfig",
);

/** JSON Schema for the VSCode plugin config. */
export const vsCodePluginJsonSchema = zodToJsonSchema(
  vsCodePluginConfigSchema,
  "VsCodePluginConfig",
);

/** JSON Schema for the LiteLLM Alias plugin config. */
export const litellmAliasPluginJsonSchema = zodToJsonSchema(
  litellmAliasPluginConfigSchema,
  "LitellmAliasPluginConfig",
);

/** Map of plugin ID to its JSON Schema for config validation. */
export const pluginConfigJsonSchemas: Record<
  string,
  Record<string, unknown>
> = {
  opencode: openCodePluginJsonSchema,
  openagent: openAgentPluginJsonSchema,
  vscode: vsCodePluginJsonSchema,
  "litellm-alias": litellmAliasPluginJsonSchema,
};

/** Get the JSON Schema for a plugin's config by ID. */
export function getPluginConfigJsonSchema(
  pluginId: string,
): Record<string, unknown> | null {
  return pluginConfigJsonSchemas[pluginId] ?? null;
}
```

- [ ] **Step 3: Export the new function from `index.ts`**

Add to `repositories/agents-repository/src/schemas/index.ts` (in the exports section):

```typescript
export {
  getPluginConfigJsonSchema,
  pluginConfigJsonSchemas,
} from "./plugin-configs";
```

- [ ] **Step 4: Verify typecheck passes**

Run: `pnpm --filter @lite-llm/agents-repository typecheck`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add repositories/agents-repository/package.json repositories/agents-repository/src/schemas/plugin-configs.ts repositories/agents-repository/src/schemas/index.ts
git commit -m "feat: add zod-to-json-schema and export plugin config JSON schemas"
```

---

### Task 2: Add `getJsonSchema()` to `PluginRegistry`

**Files:**
- Modify: `services/agent-plugins/src/plugins/registry.ts`
- Test: `services/agent-plugins/src/plugins/__tests__/registry.test.ts`

- [ ] **Step 1: Add `getJsonSchema()` method to `PluginRegistry`**

Add import at top of `services/agent-plugins/src/plugins/registry.ts`:

```typescript
import { getPluginConfigJsonSchema } from "@lite-llm/agents-repository/schemas";
```

Add method after `getConfigSchema()` (around line 137):

```typescript
  getJsonSchema(pluginId: string): Record<string, unknown> | null {
    return getPluginConfigJsonSchema(pluginId);
  }
```

- [ ] **Step 2: Add test for `getJsonSchema()`**

Add to `services/agent-plugins/src/plugins/__tests__/registry.test.ts`:

```typescript
  it("should return JSON schema for a known plugin", () => {
    const schema = registry.getJsonSchema("opencode");
    expect(schema).not.toBeNull();
    expect(schema).toHaveProperty("type", "object");
    expect(schema).toHaveProperty("properties");
  });

  it("should return null for an unknown plugin", () => {
    const schema = registry.getJsonSchema("nonexistent");
    expect(schema).toBeNull();
  });
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `pnpm --filter @lite-llm/agent-plugins test`

Expected: All tests pass (including 2 new ones)

- [ ] **Step 4: Commit**

```bash
git add services/agent-plugins/src/plugins/registry.ts services/agent-plugins/src/plugins/__tests__/registry.test.ts
git commit -m "feat: add getJsonSchema() method to PluginRegistry"
```

---

### Task 3: Add `GET /plugin-routing/:pluginId/schema` endpoint

**Files:**
- Modify: `packages/server/src/routes/plugin-routing-routes.ts`
- Modify: `packages/contracts/src/agent-catalog.ts`

- [ ] **Step 1: Add `PluginSchemaResponse` type**

Add to `packages/contracts/src/agent-catalog.ts`:

```typescript
export interface PluginSchemaResponse {
  schema: Record<string, unknown>;
}
```

- [ ] **Step 2: Add the schema endpoint**

Add to `packages/server/src/routes/plugin-routing-routes.ts` (after the `GET /plugin-routing/plugins` endpoint, around line 152):

```typescript
  // GET /plugin-routing/:pluginId/schema
  app.get("/plugin-routing/:pluginId/schema", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { pluginId } = req.params;
      const schema = manager.registry.getJsonSchema(pluginId);

      if (!schema) {
        res.status(404).json({ error: `Schema for plugin "${pluginId}" not found` });
        return;
      }

      res.json({ schema });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
```

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm --filter @lite-llm/server typecheck`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/routes/plugin-routing-routes.ts packages/contracts/src/agent-catalog.ts
git commit -m "feat: add GET /plugin-routing/:pluginId/schema endpoint"
```

---

### Task 4: Add frontend API client and hooks for schema fetching

**Files:**
- Modify: `apps/web/src/shared/lib/api-client/plugin-routing.ts`
- Modify: `apps/web/src/shared/lib/query-keys.ts`
- Modify: `apps/web/src/features/plugins/hooks/use-plugin-config.ts`
- Modify: `apps/web/src/features/plugins/use-plugin-config-page.ts`

- [ ] **Step 1: Add `getPluginSchema()` to API client**

Add to `apps/web/src/shared/lib/api-client/plugin-routing.ts`:

```typescript
export async function getPluginSchema(
  pluginId: string,
): Promise<{ schema: Record<string, unknown> }> {
  return fetchApi(`/plugin-routing/${pluginId}/schema`);
}
```

- [ ] **Step 2: Add `pluginSchema` query key**

Add to `apps/web/src/shared/lib/query-keys.ts` (inside `pluginRouting`):

```typescript
    pluginSchema: (pluginId: string) =>
      ["plugin-routing", "schema", pluginId] as const,
```

- [ ] **Step 3: Add `usePluginSchema()` hook**

Add to `apps/web/src/features/plugins/hooks/use-plugin-config.ts`:

```typescript
import { getPluginSchema } from "@/shared/lib/api-client/plugin-routing";
import { queryKeys } from "@/shared/lib/query-keys";

export function usePluginSchema(pluginId: string) {
  return useQuery({
    queryKey: queryKeys.pluginRouting.pluginSchema(pluginId),
    queryFn: () => getPluginSchema(pluginId),
    enabled: !!pluginId,
  });
}
```

- [ ] **Step 4: Update `usePluginConfigPage` to fetch schema**

Add import at top of `apps/web/src/features/plugins/use-plugin-config-page.ts`:

```typescript
import { usePluginSchema } from "./hooks/use-plugin-config";
```

Add schema query inside the hook (after existing queries):

```typescript
  const { data: schemaData } = usePluginSchema(pluginId);
```

Add `jsonSchema` to the return object:

```typescript
    jsonSchema: schemaData?.schema ?? null,
```

- [ ] **Step 5: Verify typecheck passes**

Run: `pnpm --filter web typecheck`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/shared/lib/api-client/plugin-routing.ts apps/web/src/shared/lib/query-keys.ts apps/web/src/features/plugins/hooks/use-plugin-config.ts apps/web/src/features/plugins/use-plugin-config-page.ts
git commit -m "feat: add schema fetching API client and hooks"
```

---

### Task 5: Create `JsonSchemaForm` component with RJSF + shadcn

**Files:**
- Create: `apps/web/src/shared/components/json-schema-form/json-schema-form.tsx`
- Create: `apps/web/src/shared/components/json-schema-form/widgets.tsx`
- Create: `apps/web/src/shared/components/json-schema-form/index.ts`

- [ ] **Step 1: Install RJSF dependencies**

Run: `pnpm --filter web add @rjsf/core @rjsf/utils @rjsf/validator-ajv8`

- [ ] **Step 2: Create custom shadcn widgets**

Create `apps/web/src/shared/components/json-schema-form/widgets.tsx`:

```typescript
import type { WidgetProps } from "@rjsf/utils";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

export function StringWidget(props: WidgetProps) {
  const { id, value, required, label, onChange, schema, disabled } = props;
  const isLongText = schema.description && schema.description.length > 60;

  if (isLongText) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
        <Textarea
          id={id}
          value={value ?? ""}
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
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={id}
        type={schema.format === "password" ? "password" : "text"}
        value={value ?? ""}
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
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={id}
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        min={schema.minimum}
        max={schema.maximum}
        step={schema.multipleOf ?? 0.1}
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
        checked={value ?? false}
        onCheckedChange={(checked) => onChange(checked)}
        disabled={disabled}
      />
      <Label htmlFor={id}>{label}</Label>
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
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Select
        value={value ?? ""}
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
```

- [ ] **Step 3: Create the `JsonSchemaForm` wrapper**

Create `apps/web/src/shared/components/json-schema-form/json-schema-form.tsx`:

```typescript
import Form from "@rjsf/core";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { useMemo } from "react";
import {
  BooleanWidget,
  NumberWidget,
  SelectWidget,
  StringWidget,
} from "./widgets";

interface JsonSchemaFormProps {
  schema: Record<string, unknown>;
  formData: Record<string, unknown>;
  onChange: (data: { formData: Record<string, unknown> }) => void;
}

export function JsonSchemaForm({
  schema,
  formData,
  onChange,
}: JsonSchemaFormProps) {
  const uiSchema: UiSchema = useMemo(() => {
    const ui: UiSchema = {
      "ui:submitButtonOptions": { norender: true },
    };

    // Hide internal fields
    if (schema.properties) {
      for (const key of Object.keys(schema.properties)) {
        if (key === "$schema" || key.startsWith("$")) {
          ui[key] = { "ui:widget": "hidden" };
        }
      }
    }

    return ui;
  }, [schema]);

  const widgets = useMemo(
    () => ({
      TextWidget: StringWidget,
      TextareaWidget: StringWidget,
      UpDownWidget: NumberWidget,
      SelectWidget,
      CheckboxWidget: BooleanWidget,
    }),
    [],
  );

  const fields = useMemo(
    () => ({
      TitleField: ({ title }: { title: string }) => (
        <h3 className="text-lg font-medium">{title}</h3>
      ),
      DescriptionField: ({ description }: { description: string }) =>
        description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null,
    }),
    [],
  );

  return (
    <div className="space-y-4">
      <Form
        schema={schema as RJSFSchema}
        uiSchema={uiSchema}
        formData={formData}
        validator={validator}
        widgets={widgets}
        fields={fields}
        onChange={onChange}
        liveValidate
        noHtml5Validate
      />
    </div>
  );
}
```

- [ ] **Step 4: Create barrel export**

Create `apps/web/src/shared/components/json-schema-form/index.ts`:

```typescript
export { JsonSchemaForm } from "./json-schema-form";
```

- [ ] **Step 5: Verify typecheck passes**

Run: `pnpm --filter web typecheck`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/shared/components/json-schema-form/
git commit -m "feat: add JsonSchemaForm component with RJSF + shadcn widgets"
```

---

### Task 6: Create dedicated OpenCode config page

**Files:**
- Create: `apps/web/src/features/plugins/opencode-config/opencode-config-page.tsx`
- Create: `apps/web/src/features/plugins/opencode-config/index.ts`

- [ ] **Step 1: Create the OpenCode config page**

Create `apps/web/src/features/plugins/opencode-config/opencode-config-page.tsx`:

```typescript
import { useCallback, useMemo } from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface OpenCodeConfigPageProps {
  config: Record<string, unknown>;
  availableModels: string[];
  onChange: (key: string, value: unknown) => void;
}

export function OpenCodeConfigPage({
  config,
  availableModels,
  onChange,
}: OpenCodeConfigPageProps) {
  const defaultModel = (config.defaultModel as string) ?? "";
  const defaultTemperature = (config.defaultTemperature as number) ?? 0.2;

  const handleModelChange = useCallback(
    (value: string) => onChange("defaultModel", value),
    [onChange],
  );

  const handleTempChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange("defaultTemperature", Number(e.target.value));
    },
    [onChange],
  );

  const modelOptions = useMemo(() => {
    if (availableModels.length === 0) {
      return [{ value: "", label: "No models configured" }];
    }
    return [
      { value: "", label: "Use agent-specific model" },
      ...availableModels.map((m) => ({ value: m, label: m })),
    ];
  }, [availableModels]);

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
          <Select value={defaultModel} onValueChange={handleModelChange}>
            <SelectTrigger id="defaultModel" className="w-full">
              <SelectValue placeholder="Select a model..." />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
```

- [ ] **Step 2: Create barrel export**

Create `apps/web/src/features/plugins/opencode-config/index.ts`:

```typescript
export { OpenCodeConfigPage } from "./opencode-config-page";
```

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm --filter web typecheck`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/plugins/opencode-config/
git commit -m "feat: add dedicated OpenCode config page"
```

---

### Task 7: Wire up `PluginConfigPage` to route between OpenCode and generic form

**Files:**
- Modify: `apps/web/src/features/plugins/index.tsx`

- [ ] **Step 1: Add `pluginId` to the hook return**

Add to `apps/web/src/features/plugins/use-plugin-config-page.ts` return object:

```typescript
    pluginId,
```

- [ ] **Step 2: Update `PluginConfigPage` to route based on `pluginId`**

Modify `apps/web/src/features/plugins/index.tsx`:

Add import at top:

```typescript
import { OpenCodeConfigPage } from "./opencode-config";
import { JsonSchemaForm } from "@/shared/components/json-schema-form";
```

Replace the `PluginConfigForm` section (around line 72-76) with:

```tsx
          {state.pluginId === "opencode" ? (
            <OpenCodeConfigPage
              config={state.configValues}
              availableModels={state.availableModels}
              onChange={state.handleConfigChange}
            />
          ) : state.jsonSchema ? (
            <div className="space-y-4">
              <JsonSchemaForm
                schema={state.jsonSchema}
                formData={state.configValues}
                onChange={(data) => {
                  for (const [key, value] of Object.entries(data.formData)) {
                    state.handleConfigChange(key, value);
                  }
                }}
              />
            </div>
          ) : (
            <PluginConfigForm
              schema={state.schema}
              values={state.configValues}
              onChange={state.handleConfigChange}
            />
          )}
```

- [ ] **Step 2: Add `pluginId` and `availableModels` to the page hook return**

Add to `apps/web/src/features/plugins/use-plugin-config-page.ts` return object:

```typescript
    pluginId,
    availableModels: Object.keys(safeData.config?.provider?.litellm?.models ?? {}),
```

Wait — `safeData.config` is the plugin config from `plugins.jsonc`, not the output JSON. The available models should come from the models catalog, not the plugin config. Let me use the existing models data source instead.

Actually, looking at the existing code more carefully, the `PluginConfigResponse` returns `config` which is the flat config from `plugins.jsonc`. For OpenCode, we need the list of available models. The best source is the models manager. But since we don't have direct access from the frontend, let's derive it from the schema or use a simpler approach: just let the user type the model name (the existing `ConfigField` approach uses a text input with placeholder).

Let me simplify: the OpenCode page will use a text input for `defaultModel` (matching the existing behavior), not a select. This avoids needing a new API endpoint for model listing.

Revised Step 1 — replace the `PluginConfigForm` section with:

```tsx
          {state.pluginId === "opencode" ? (
            <OpenCodeConfigPage
              config={state.configValues}
              availableModels={[]}
              onChange={state.handleConfigChange}
            />
          ) : state.jsonSchema ? (
            <div className="space-y-4">
              <JsonSchemaForm
                schema={state.jsonSchema}
                formData={state.configValues}
                onChange={(data) => {
                  for (const [key, value] of Object.entries(data.formData)) {
                    state.handleConfigChange(key, value);
                  }
                }}
              />
            </div>
          ) : (
            <PluginConfigForm
              schema={state.schema}
              values={state.configValues}
              onChange={state.handleConfigChange}
            />
          )}
```

And update `OpenCodeConfigPage` to handle empty `availableModels` by showing a text input fallback. Let me update the component from Task 6:

In `apps/web/src/features/plugins/opencode-config/opencode-config-page.tsx`, update the model section:

```tsx
        <div className="space-y-2">
          <Label htmlFor="defaultModel">Default Model</Label>
          <p className="text-xs text-muted-foreground">
            Model to use when a system agent has no model configured
          </p>
          {availableModels.length > 0 ? (
            <Select value={defaultModel} onValueChange={handleModelChange}>
              <SelectTrigger id="defaultModel" className="w-full">
                <SelectValue placeholder="Select a model..." />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="defaultModel"
              value={defaultModel}
              onChange={(e) => onChange("defaultModel", e.target.value)}
              placeholder="e.g. gpt-4"
            />
          )}
        </div>
```

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm --filter web typecheck`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/plugins/index.tsx apps/web/src/features/plugins/use-plugin-config-page.ts apps/web/src/features/plugins/opencode-config/opencode-config-page.tsx
git commit -m "feat: wire up PluginConfigPage to route between OpenCode and generic form"
```

---

### Task 8: Full verification

- [ ] **Step 1: Run full typecheck**

Run: `pnpm typecheck`

Expected: All 18 packages pass

- [ ] **Step 2: Run all tests**

Run: `pnpm test`

Expected: All tests pass

- [ ] **Step 3: Run lint**

Run: `pnpm lint`

Expected: No errors

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address typecheck and test issues"
```
