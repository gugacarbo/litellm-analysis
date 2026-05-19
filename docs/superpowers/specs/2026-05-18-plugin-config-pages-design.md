# Plugin Config Pages — Design Spec

**Date:** 2026-05-18
**Author:** Loom (via brainstorming)
**Status:** Draft — pending review

## 1. Problem

The current `PluginConfigPage` renders a generic `PluginConfigForm` from `ConfigField[]` (flat key-value fields). This works for simple configs like `defaultModel` and `defaultTemperature`, but:

1. The OpenCode plugin config deserves a dedicated page with typed form fields, since it's the primary consumer-facing config.
2. Other plugins (openagent, vscode, litellm-alias) need a JSON Schema-driven form that auto-generates UI from their JSON Schema, so validation and field types stay in sync when schemas change.

## 2. Scope

### In Scope
- Dedicated OpenCode config page with typed form fields (`defaultModel`, `defaultTemperature`)
- Generic `JsonSchemaForm` component using `@rjsf/core` + `@rjsf/validator-ajv8` for other plugins
- Server endpoint to serve JSON Schema per plugin
- `PluginConfigPage` routes to OpenCode page or generic form based on `pluginId`
- Persist changes via existing `PUT /plugin-routing/:pluginId/config` API

### Out of Scope
- Editing plugin output JSON files (`@storage/output/*.json`) — these are always generated
- Agent mapping table or category export list changes — these remain on the page
- New plugins beyond the 4 existing ones

## 3. Architecture

### 3.1 Server Changes

**File:** `packages/server/src/routes/plugin-routing-routes.ts`

Add a new endpoint:

```
GET /plugin-routing/:pluginId/schema
```

Returns the JSON Schema for the plugin's **config** (not output schema). The config schemas are defined as Zod in `repositories/agents-repository/src/schemas/plugin-configs.ts`. We use `zod-to-json-schema` to generate JSON Schema from Zod at build time or runtime.

**New dependency:** `zod-to-json-schema` (added to `@lite-llm/agents-repository`)

The `PluginRegistry` needs a new method:

```typescript
getJsonSchema(pluginId: string): Record<string, unknown> | null;
```

Each plugin's config schema (Zod) is converted to JSON Schema via `zod-to-json-schema()`. The result is cached and served by the endpoint.

**Response shape (example for opencode):**

```json
{
  "title": "OpenCode Config",
  "description": "OpenCode AI SDK plugin configuration",
  "type": "object",
  "properties": {
    "defaultModel": {
      "type": "string",
      "title": "Default Model",
      "description": "Model to use when a system agent has no model configured"
    },
    "defaultTemperature": {
      "type": "number",
      "title": "Default Temperature",
      "description": "Default sampling temperature for agents without one configured",
      "default": 0.2
    }
  }
}
```

### 3.2 Frontend Changes

#### 3.2.1 New Dependencies

```bash
pnpm add @rjsf/core @rjsf/utils @rjsf/validator-ajv8
```

#### 3.2.2 OpenCode Config Page

**Location:** `apps/web/src/features/plugins/opencode-config/`

Files:
- `opencode-config-page.tsx` — Page component
- `use-opencode-config.ts` — Page hook (state, actions, derived)
- `opencode-config-form.tsx` — Form with typed fields

Fields:
- `defaultModel` — Select dropdown (populated from available models)
- `defaultTemperature` — Number input (0–2, step 0.1)

Uses existing `PluginConfigForm` pattern with shadcn primitives.

#### 3.2.3 Generic JSON Schema Form

**Location:** `apps/web/src/shared/components/json-schema-form/`

Files:
- `json-schema-form.tsx` — Wrapper around `@rjsf/core` Form
- `shadcn-theme.ts` — RJSF theme using shadcn/ui widgets
- `widgets.ts` — Custom widgets (Input, Select, Switch, Textarea)

Key design decisions:
- Use `@rjsf/core` with a custom theme that maps RJSF widgets to shadcn components
- Use `@rjsf/validator-ajv8` for schema validation
- Hide `$schema` field via `uiSchema` (internal field, not user-editable)
- `onChange` callback returns `formData` to parent for save
- `onSubmit` disabled — parent controls save via existing API

#### 3.2.4 PluginConfigPage Routing

**File:** `apps/web/src/features/plugins/index.tsx`

Current behavior: renders `PluginConfigForm` + `AgentMappingTable` + `CategoryExportList`.

New behavior:
- If `pluginId === "opencode"` → render `OpenCodeConfigPage` (dedicated form)
- Else → render `JsonSchemaForm` with the plugin's JSON Schema
- `AgentMappingTable` and `CategoryExportList` remain below the config section for all plugins

#### 3.2.5 API Client

**File:** `apps/web/src/shared/lib/api-client/plugin-routing.ts`

Add:

```typescript
export async function getPluginSchema(
  pluginId: string,
): Promise<Record<string, unknown>> {
  return fetchApi(`/plugin-routing/${pluginId}/schema`);
}
```

#### 3.2.6 Hooks

**File:** `apps/web/src/features/plugins/hooks/use-plugin-config.ts`

Add:

```typescript
export function usePluginSchema(pluginId: string) {
  return useQuery({
    queryKey: queryKeys.pluginRouting.pluginSchema(pluginId),
    queryFn: () => getPluginSchema(pluginId),
    enabled: !!pluginId,
  });
}
```

**File:** `apps/web/src/features/plugins/use-plugin-config-page.ts`

Add `jsonSchema` to the returned state, fetched via `usePluginSchema`.

### 3.3 Data Flow

```
User opens /plugins/:pluginId
  → GET /plugin-routing/:pluginId/config (existing)
  → GET /plugin-routing/:pluginId/schema (new)
  → If opencode: render OpenCodeConfigForm
  → Else: render JsonSchemaForm with schema + config data
  → User edits → onChange updates local state
  → User clicks Save → PUT /plugin-routing/:pluginId/config
  → Server merges config, reloads registry, exports all plugins
```

## 4. Error Handling

- **Schema fetch fails:** Fall back to existing `ConfigField[]` form (backward compatible)
- **Validation errors:** RJSF displays inline errors from AJV8 validator
- **Save fails:** Toast error message, form data preserved
- **Unknown pluginId:** Existing "Plugin not found" state

## 5. Testing

- Unit tests for `JsonSchemaForm` component (renders fields, validates, onChange)
- Unit tests for `OpenCodeConfigForm` (renders fields, saves)
- Integration test for `GET /plugin-routing/:pluginId/schema` endpoint
- Manual test: edit config, save, verify output JSON regenerated correctly

## 6. File Change Summary

| File | Action | Reason |
|------|--------|--------|
| `repositories/agents-repository/package.json` | Modify | Add `zod-to-json-schema` dependency |
| `repositories/agents-repository/src/schemas/plugin-configs.ts` | Modify | Export JSON Schema generation function |
| `services/agent-plugins/src/plugins/registry.ts` | Modify | Add `getJsonSchema()` method |
| `packages/server/src/routes/plugin-routing-routes.ts` | Modify | Add `GET /plugin-routing/:pluginId/schema` |
| `packages/contracts/src/agent-catalog.ts` | Modify | Add `PluginSchemaResponse` type |
| `apps/web/src/shared/lib/api-client/plugin-routing.ts` | Modify | Add `getPluginSchema()` |
| `apps/web/src/shared/lib/query-keys.ts` | Modify | Add `pluginSchema` query key |
| `apps/web/src/shared/components/json-schema-form/` | Create | RJSF + shadcn wrapper |
| `apps/web/src/features/plugins/opencode-config/` | Create | Dedicated OpenCode page |
| `apps/web/src/features/plugins/index.tsx` | Modify | Route to OpenCode or generic form |
| `apps/web/src/features/plugins/use-plugin-config-page.ts` | Modify | Fetch JSON schema |
| `apps/web/src/features/plugins/hooks/use-plugin-config.ts` | Modify | Add `usePluginSchema` hook |
