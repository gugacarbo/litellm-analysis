# Model Config Screen Refactor Implementation Plan

> **For agentic workers:** Use subagent-driven development to implement this plan task-by-task.
> The executable source of truth is `docs/tasks/0007-model-config-screen-refactor/super-plan.json`.

**Goal:** Refactor the model detail Settings tab into a tab-based UI (General / Routing / Advanced) with the monolithic 603-line hook split into three focused sub-hooks plus a thin composer.

**Architecture:** Three extracted hooks (`useModelConfigForm`, `useModelAliases`, `useModelConfigSave`) compose into a slim `useModelConfigPage` controller. The rewritten `ModelConfigForm` renders a shadcn `Tabs` shell hosting three leaf tab components, with a sticky footer reflecting combined dirty state from the form and aliases hooks.

**Tech Stack:** React 19, TanStack React Query, shadcn/ui (`Tabs`, `CollapsibleSection`, `Switch`, `Select`, `Card`, `Button`, `Input`, `Label`), React Router, TypeScript.

## Global Constraints

- No backend, API, schema, or routing-structure changes — pure `apps/web` refactor.
- Save behavior must match current behavior exactly: `updateModel(modelName, routeUpdate, undefined, config)` first, then `updateModelAliases` if aliases loaded, with the same partial-failure toasts.
- `ModelConfigFormData` loses `aliasesLoaded`, `aliasesLoading`, `aliasesLoadError` — these move into `useModelAliases` return shape.
- All hint text in English; remove the existing hard-coded Portuguese hint on `Owned By`.
- Feature isolation: new files live under `apps/web/src/features/models/`; import only from `@/shared/*` and sibling feature files.
- No new top-level directories; respect `apps/web/AGENTS.md` anti-patterns.
- shadcn primitives reused: `Tabs`, `CollapsibleSection` (`@/shared/components/ui/collapsible-section`), `Card`, `Switch`, `Select`, `Input`, `Label`, `Button`.
- Dirty indicator and Save enablement reflect `formIsDirty || aliasesIsDirty`.
- Reasoning sub-section collapses by default; collapsing never clears values.

## File Structure

| File/Directory | Owner Task | Notes |
| --------------- | ---------- | ----- |
| `apps/web/src/features/models/use-model-config-form.ts` | Task-A1-0007 | Slimmed `ModelConfigFormData` type, `modelToFormData`, `buildConfigFromFormData`, form state, dirty tracking, extra-param handlers. NEW file. |
| `apps/web/src/features/models/use-model-aliases.ts` | Task-A2-0007 | Aliases query + mutation state, `normalizeAliases`, `getAliasValidationError`, dirty tracking, reset-on-model. NEW file. |
| `apps/web/src/features/models/use-model-config-save.ts` | Task-B1-0007 | `updateModel` mutation + `updateModelAliases` orchestration with partial-failure toasts; receives `ModelConfigFormData` and aliases state. NEW file. |
| `apps/web/src/features/models/components/model-general-tab.tsx` | Task-C1-0007 | General tab leaf component + extracted `ReasoningSection` using `CollapsibleSection`. NEW file. |
| `apps/web/src/features/models/components/model-routing-tab.tsx` | Task-C2-0007 | Routing tab wrapping existing `ModelAliasesEditor`. NEW file. |
| `apps/web/src/features/models/components/model-advanced-tab.tsx` | Task-C3-0007 | Advanced tab: API Base, Provider, Costs, Extra Params. NEW file. |
| `apps/web/src/features/models/use-model-config-page.ts` | Task-D1-0007 | REWRITE as thin composer exposing `ModelConfigController`. |
| `apps/web/src/features/models/components/model-config-form.tsx` | Task-D2-0007 | REWRITE as Tabs shell + sticky footer; consumes `ModelConfigController`. |
| `apps/web/src/features/models/detail/model-detail-settings-tab.tsx` | Task-D3-0007 | Minimal update to consume the new controller shape; verify typecheck/test/lint. |

## Structured Registry

- **Registry:** `docs/tasks/0007-model-config-screen-refactor/super-plan.json`
- **Progress ledger:** `docs/tasks/0007-model-config-screen-refactor/progress-ledger.md` (created in Phase 4 and regenerated on every `super-plan.json` write)
- **Task directories:** `docs/tasks/0007-model-config-screen-refactor/<task-id>/` (materialized in Phase 6)
- **Task-local logs:** `docs/tasks/0007-model-config-screen-refactor/<task-id>/progress.log` (materialized in Phase 6)
- **Task-local logger:** `docs/tasks/0007-model-config-screen-refactor/<task-id>/log-task.sh` (materialized in Phase 6)

---

## Task-A1-0007 — Extract `useModelConfigForm` hook

**Batch:** A (parallel) · **Phase:** foundation · **Depends on:** none

Create `apps/web/src/features/models/use-model-config-form.ts` containing the slimmed form-data type and pure form-state logic extracted from the current `use-model-config-page.ts`.

### Steps

1. Create `apps/web/src/features/models/use-model-config-form.ts`.
2. Define the slimmed `ModelConfigFormData` interface (remove `aliases`, `aliasesLoaded`, `aliasesLoading`, `aliasesLoadError` — aliases are owned by `useModelAliases`):

```ts
export interface ModelConfigFormData {
  displayName: string;
  family: string;
  ownedBy: string;
  apiMode: "openai" | "anthropic" | "";
  vision: boolean;
  enabled: boolean;
  thinkingLevels: string[];
  reasoning: {
    enabled: boolean;
    effort: "low" | "medium" | "high" | "xhigh" | "";
    apiMode: "openai" | "anthropic" | "";
    enableThinking: boolean;
    includeReasoningInRequest: boolean;
  };
  apiBase: string;
  providerName: string;
  inputCostPerToken: string;
  outputCostPerToken: string;
  extraParams: Record<string, string>;
}
```

3. Copy `getEmptyFormData()` from `use-model-config-page.ts` and adapt it to the slimmed shape (drop alias fields).
4. Copy `modelToFormData(model: ModelWithStatus): ModelConfigFormData` from `use-model-config-page.ts` lines 74–136. Remove the alias-related fields from the returned object (`aliases`, `aliasesLoaded`, `aliasesLoading`, `aliasesLoadError`). Keep `displayName`, `family`, `ownedBy`, `enabled`, `thinkingLevels`, `reasoning`, `apiMode`, `vision`, `apiBase`, `providerName`, `inputCostPerToken`, `outputCostPerToken`, `extraParams`.
5. Copy `buildConfigFromFormData(formData: ModelConfigFormData): ModelConfig["config"]` from `use-model-config-page.ts` lines 138–163 verbatim (it already ignores aliases).
6. Copy `getComparableFormData` and `areFormDataEqual` from `use-model-config-page.ts` lines 197–224. Remove `aliases` from `getComparableFormData` since it's no longer in `ModelConfigFormData`.
7. Define `useModelConfigForm` hook that owns form state and exposes:

```ts
export interface UseModelConfigFormResult {
  formData: ModelConfigFormData;
  initialFormData: ModelConfigFormData;
  isDirty: boolean;
  onFormDataChange: (next: ModelConfigFormData) => void;
  onAddExtraParam: () => void;
  onRemoveExtraParam: (key: string) => void;
  onUpdateExtraParam: (key: string, value: string) => void;
  resetForModel: (model: ModelWithStatus | null) => void;
  commitSaved: (saved: ModelConfigFormData) => void;
}
```

The hook body:
- `useState<ModelConfigFormData>(getEmptyFormData)` for `formData` and `initialFormData`.
- `useEffect`-free: expose `resetForModel(model)` that callers invoke on model change. Inside, call `modelToFormData(model)` when `model` is truthy, else `getEmptyFormData()`; set both `formData` and `initialFormData` to that value.
- `isDirty = !areFormDataEqual(formData, initialFormData)`.
- `onFormDataChange(next)` = `setFormData(next)`.
- `onAddExtraParam`, `onRemoveExtraParam`, `onUpdateExtraParam` copied verbatim from `use-model-config-page.ts` lines 412–431.
- `commitSaved(saved)` sets both `formData` and `initialFormData` to `saved`, used by the save hook after a successful save to clear dirty state.

8. Imports: `useCallback, { useState }` from `react`; `{ type ModelConfig, type ModelWithStatus, resolveModelRoute }` from `@/shared/lib/api-client/models`; `{ parseExtraParamValue }` is NOT needed here (it lives in the save hook). Actually, `parseExtraParamValue` is used in `handleSave`, not in form state — omit it.

### Verification

- File compiles with `pnpm --filter @lite-llm/web typecheck` (once D1 wires it; standalone type errors from missing consumers are acceptable mid-batch and resolved by D1).

---

## Task-A2-0007 — Extract `useModelAliases` hook

**Batch:** A (parallel) · **Phase:** foundation · **Depends on:** none

Create `apps/web/src/features/models/use-model-aliases.ts` isolating alias query, mutation, dirty tracking, and validation.

### Steps

1. Create `apps/web/src/features/models/use-model-aliases.ts`.
2. Copy `normalizeAliases(aliases: string[]): string[]` from `use-model-config-page.ts` lines 165–175 verbatim.
3. Copy `getAliasValidationError(aliases: string[]): string | null` from `use-model-config-page.ts` lines 177–195 verbatim.
4. Define the hook result interface:

```ts
export interface UseModelAliasesResult {
  aliases: string[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  isDirty: boolean;
  setAliases: (next: string[]) => void;
  resetForModel: (modelName: string) => void;
  getValidationError: () => string | null;
  normalizedAliases: string[];
}
```

5. Implement `useModelAliases(modelName: string)`:
   - `useQuery({ queryKey: ["model-aliases", modelName], queryFn: () => getModelAliases(modelName), enabled: modelName.length > 0 })` copied from `use-model-config-page.ts` lines 252–256.
   - Local state: `aliases: string[]`, `initialAliases: string[]`, `touched: boolean`.
   - `useEffect` watching `aliasesQuery.data`, `aliasesQuery.isError`, `aliasesQuery.isPending`, and `modelName`. Mirror the logic in `use-model-config-page.ts` lines 299–399 but write only into `aliases`/`initialAliases`/`loaded`/`loading`/`error`:
     - On `aliasesQuery.data`: if `!touched` and model changed, set `aliases` and `initialAliases` to `data.aliases`; mark `loaded=true, loading=false, error=null`.
     - On `aliasesQuery.isError`: set `loaded=false, loading=false, error=<same string as today>`. Toast once per model (keep the `aliasErrorToastModelRef` pattern).
     - On `aliasesQuery.isPending`: set `loading=true, error=null`.
     - On `modelName` empty: reset `aliases=[]`, `initialAliases=[]`, `loaded=false`.
   - `isDirty = JSON.stringify(aliases) !== JSON.stringify(initialAliases)`.
   - `setAliases(next)`: set `touched=true`, set `aliases=next`.
   - `resetForModel(name)`: reset `touched=false` and trigger re-hydration on next query data (the effect handles it).
   - `getValidationError()`: returns `getAliasValidationError(aliases)` (only meaningful when `loaded=true`).
   - `normalizedAliases = normalizeAliases(aliases)`.
6. Imports: `useQuery` from `@tanstack/react-query`; `{ useEffect, useRef, useState }` from `react`; `{ toast }` from `sonner`; `{ getModelAliases }` from `@/shared/lib/api-client/model-aliases`.
7. Export `normalizeAliases` and `getAliasValidationError` as named exports so the save hook can import them.

### Verification

- File compiles; consumers wired in B1 and D1.

---

## Task-B1-0007 — Extract `useModelConfigSave` hook

**Batch:** B · **Phase:** core · **Depends on:** Task-A1-0007, Task-A2-0007

Create `apps/web/src/features/models/use-model-config-save.ts` containing the save orchestration logic extracted from `handleSave` in `use-model-config-page.ts` lines 435–588.

### Steps

1. Create `apps/web/src/features/models/use-model-config-save.ts`.
2. Define the args interface:

```ts
import type { ModelConfigFormData } from "./use-model-config-form";
import type { UseModelAliasesResult } from "./use-model-aliases";
import type { ModelWithStatus } from "@/shared/lib/api-client/models";
import type { QueryClient } from "@tanstack/react-query";

export interface UseModelConfigSaveArgs {
  model: ModelWithStatus | null;
  formData: ModelConfigFormData;
  aliases: UseModelAliasesResult;
  queryClient: QueryClient;
  onSaved: () => void;
}
```

3. Define the result interface:

```ts
export interface UseModelConfigSaveResult {
  saving: boolean;
  save: () => Promise<void>;
}
```

4. Implement `useModelConfigSave({ model, formData, aliases, queryClient, onSaved })`:
   - `const [isSaving, setIsSaving] = useState(false)`.
   - `const updateMutation = useMutation({ mutationFn: (params) => updateModel(params.modelName, params.modelRoute, undefined, params.config) })` copied from `use-model-config-page.ts` lines 258–270.
   - Implement `save` by copying the body of `handleSave` (lines 435–588) with these adaptations:
     - Replace `formData.aliasesLoaded` checks with `aliases.loaded`.
     - Replace `formData.aliases` reads with `aliases.aliases`.
     - Replace `normalizeAliases(formData.aliases)` with `aliases.normalizedAliases`.
     - Replace `getAliasValidationError(formData.aliases)` with `aliases.getValidationError()`.
     - Replace `updateModelAliases(model.modelName, nextAliases)` call unchanged.
     - After full success, call `onSaved()` (the composer passes a function that calls `form.commitSaved(formData)` and `aliases.resetForModel(model.modelName)` so dirty state clears).
     - Keep all `toast.error` / `toast.success` strings byte-identical to today.
     - Keep `queryClient.invalidateQueries` calls unchanged.
   - `saving = isSaving || updateMutation.isPending`.
5. Imports: `useMutation` from `@tanstack/react-query`; `{ useState }` from `react`; `{ toast }` from `sonner`; `{ updateModel, resolveModelRoute, type ModelRouteUpdate, type ModelConfig }` from `@/shared/lib/api-client/models`; `{ updateModelAliases }` from `@/shared/lib/api-client/model-aliases`; `{ parseExtraParamValue }` from `./models-form-utils`; types from A1/A2.

### Verification

- File compiles; consumers wired in D1.

---

## Task-C1-0007 — Create `ModelGeneralTab` + `ReasoningSection`

**Batch:** C (parallel) · **Phase:** surface · **Depends on:** Task-A1-0007 (type only)

Create `apps/web/src/features/models/components/model-general-tab.tsx`.

### Steps

1. Create the file.
2. Import `CollapsibleSection` from `@/shared/components/ui/collapsible-section`.
3. Import `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` from `@/shared/components/ui/card`.
4. Import `Settings` from `lucide-react`.
5. Import `Input`, `Label`, `Select` (+ `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`), `Switch` from `@/shared/components/ui/*`.
6. Import `ModelConfigFormData` type from `../use-model-config-form`.
7. Define the props interface:

```ts
interface ModelGeneralTabProps {
  modelName: string;
  formData: ModelConfigFormData;
  onFormDataChange: (next: ModelConfigFormData) => void;
}
```

8. Implement `ModelGeneralTab` rendering a `Card` titled "General Settings" with:
   - Grid `sm:grid-cols-2`: Model Name (immutable, `disabled` `bg-muted`) + Display Name input.
   - Grid `sm:grid-cols-3`: Family input, Owned By input (with English-only hint: "Use `chatgpt-subscription` to route via OpenAI OAuth/Codex plan."), API Mode select (Default / OpenAI / Anthropic).
   - Grid `sm:grid-cols-2`: Thinking Levels input (comma-separated) + Vision switch.
   - Enabled switch row.
   - `<ReasoningSection formData={formData} onFormDataChange={onFormDataChange} />`.
9. Extract `ReasoningSection` as an internal component using `CollapsibleSection` with `title="Reasoning / Thinking"` and `defaultOpen={false}`. Children: the existing reasoning fields from `model-config-form.tsx` lines 275–382 (Reasoning Effort select, Reasoning API Mode select, Enable Thinking switch, Include Reasoning switch). Adapt imports of `useCallback` removed — use a plain `updateReasoning` helper inline since the parent's `onFormDataChange` already does the spread.
10. No Portuguese text anywhere.

### Verification

- File compiles; wired in D2.

---

## Task-C2-0007 — Create `ModelRoutingTab`

**Batch:** C (parallel) · **Phase:** surface · **Depends on:** Task-A2-0007 (type only)

Create `apps/web/src/features/models/components/model-routing-tab.tsx`.

### Steps

1. Create the file.
2. Import `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` from `@/shared/components/ui/card`.
3. Import `Route` icon from `lucide-react`.
4. Import `ModelAliasesEditor` from `./model-aliases-editor`.
5. Define the props interface:

```ts
interface ModelRoutingTabProps {
  aliases: string[];
  loading: boolean;
  error: string | null;
  disabled: boolean;
  onChange: (next: string[]) => void;
}
```

6. Implement `ModelRoutingTab` rendering a `Card` titled "Manual Routing Aliases" with description "Aliases that route to this model. These are internal routing names only." Then render `<ModelAliasesEditor>` with the props forwarded.

### Verification

- File compiles; wired in D2.

---

## Task-C3-0007 — Create `ModelAdvancedTab`

**Batch:** C (parallel) · **Phase:** surface · **Depends on:** Task-A1-0007 (type only)

Create `apps/web/src/features/models/components/model-advanced-tab.tsx` containing the current `DatabaseSettingsSection` body, adapted to a tab layout.

### Steps

1. Create the file.
2. Import `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` from `@/shared/components/ui/card`.
3. Import `Database`, `Plus`, `Trash2` from `lucide-react`.
4. Import `Button`, `Input`, `Label`, `Select` (+ children), `Switch` (if needed) from `@/shared/components/ui/*`.
5. Import `RegistryProvider` type from `@/shared/lib/api-client/providers`.
6. Import `ModelConfigFormData` type from `../use-model-config-form`.
7. Define the props interface:

```ts
interface ModelAdvancedTabProps {
  formData: ModelConfigFormData;
  providers: RegistryProvider[];
  onFormDataChange: (next: ModelConfigFormData) => void;
  onAddExtraParam: () => void;
  onRemoveExtraParam: (key: string) => void;
  onUpdateExtraParam: (key: string, value: string) => void;
}
```

8. Implement `ModelAdvancedTab` rendering a `Card` titled "Advanced Settings" with description "LiteLLM database parameters. Environment-specific." Body copied from the current `DatabaseSettingsSection` (lines 384–571 of `model-config-form.tsx`) verbatim, including: API Base URL input, Provider select, Input Cost input, Output Cost input, Extra Parameters list with key/value inputs and remove buttons, and the "Add Parameter" button.

### Verification

- File compiles; wired in D2.

---

## Task-D1-0007 — Rewrite `useModelConfigPage` as thin composer

**Batch:** D · **Phase:** final · **Depends on:** Task-A1-0007, Task-A2-0007, Task-B1-0007

Rewrite `apps/web/src/features/models/use-model-config-page.ts` to compose the three extracted hooks.

### Steps

1. Open `apps/web/src/features/models/use-model-config-page.ts`.
2. Replace the entire file content. Remove all relocated code.
3. Import `useModelConfigForm` from `./use-model-config-form`, `useModelAliases` from `./use-model-aliases`, `useModelConfigSave` from `./use-model-config-save`.
4. Re-export the slimmed `ModelConfigFormData` from `./use-model-config-form` so existing importers (`model-config-form.tsx`, `model-detail-settings-tab.tsx`) continue to compile: `export type { ModelConfigFormData } from "./use-model-config-form";`
5. Define the controller interface:

```ts
export interface ModelConfigController {
  model: ModelWithStatus | null;
  formData: ModelConfigFormData;
  isDirty: boolean;
  saving: boolean;
  providers: RegistryProvider[];
  aliases: UseModelAliasesResult;
  onFormDataChange: (next: ModelConfigFormData) => void;
  onAddExtraParam: () => void;
  onRemoveExtraParam: (key: string) => void;
  onUpdateExtraParam: (key: string, value: string) => void;
  onSave: () => void;
  onBack: () => void;
}
```

6. Implement `useModelConfigPageFromContext(): ModelConfigController`:
   - `const { model, providers } = useModelDetailContext();`
   - `const queryClient = useQueryClient();`
   - `const navigate = useNavigate();`
   - `const modelName = model?.modelName ?? "";`
   - `const form = useModelConfigForm();`
   - `const aliases = useModelAliases(modelName);`
   - `useEffect` calling `form.resetForModel(model)` whenever `model` changes (depend on `model` reference).
   - `const { saving, save } = useModelConfigSave({ model, formData: form.formData, aliases, queryClient, onSaved: () => { form.commitSaved(form.formData); aliases.resetForModel(modelName); } });`
   - `const isDirty = form.isDirty || aliases.isDirty;`
   - `onBack: () => navigate("/models")`.
   - Return the controller object.
7. Remove the old `UseModelConfigPageResult` interface (replaced by `ModelConfigController`). Update any imports of `UseModelConfigPageResult` in the codebase — search shows it is only referenced in types, so update or remove.

### Verification

- `pnpm --filter @lite-llm/web typecheck` passes.

---

## Task-D2-0007 — Rewrite `ModelConfigForm` as Tabs shell + footer

**Batch:** D · **Phase:** final · **Depends on:** Task-C1-0007, Task-C2-0007, Task-C3-0007, Task-D1-0007

Rewrite `apps/web/src/features/models/components/model-config-form.tsx` to consume `ModelConfigController` and render three tabs + a sticky footer.

### Steps

1. Open `apps/web/src/features/models/components/model-config-form.tsx`.
2. Replace the entire file content.
3. Imports: `Tabs, TabsContent, TabsList, TabsTrigger` from `@/shared/components/ui/tabs`; `Button` from `@/shared/components/ui/button`; `ModelGeneralTab` from `./model-general-tab`; `ModelRoutingTab` from `./model-routing-tab`; `ModelAdvancedTab` from `./model-advanced-tab`; `ModelConfigController` type from `../use-model-config-page`.
4. Define `ModelConfigFormProps`:

```ts
interface ModelConfigFormProps {
  controller: ModelConfigController;
}
```

5. Implement `ModelConfigForm`:
   - Render `<div className="space-y-6">`.
   - `<Tabs defaultValue="general">`
     - `<TabsList>` with three `TabsTrigger`: "General", "Routing", "Advanced".
     - `<TabsContent value="general">` rendering `<ModelGeneralTab modelName={controller.model?.modelName ?? ""} formData={controller.formData} onFormDataChange={controller.onFormDataChange} />`.
     - `<TabsContent value="routing">` rendering `<ModelRoutingTab aliases={controller.aliases.aliases} loading={controller.aliases.loading} error={controller.aliases.error} disabled={controller.saving} onChange={controller.aliases.setAliases} />`.
     - `<TabsContent value="advanced">` rendering `<ModelAdvancedTab formData={controller.formData} providers={controller.providers} onFormDataChange={controller.onFormDataChange} onAddExtraParam={controller.onAddExtraParam} onRemoveExtraParam={controller.onRemoveExtraParam} onUpdateExtraParam={controller.onUpdateExtraParam} />`.
   - Footer `<div className="flex items-center justify-between border-t pt-4">`:
     - Left: `<p className="text-sm text-muted-foreground">{controller.isDirty ? "You have unsaved changes" : "No unsaved changes"}</p>`
     - Right: Back button (`variant="outline"` → `controller.onBack`) + Save button (`onClick={controller.onSave}` disabled when `controller.saving || controller.aliases.loading || !controller.isDirty`, label `controller.saving ? "Saving..." : "Save"`).
6. Remove the old `GlobalSettingsSection`, `ReasoningSettingsSection`, `DatabaseSettingsSection` functions and all imports they used.

### Verification

- `pnpm --filter @lite-llm/web typecheck` passes.
- `pnpm --filter @lite-llm/web lint` passes.

---

## Task-D3-0007 — Wire up settings tab and verify

**Batch:** D · **Phase:** final · **Depends on:** Task-D2-0007

Update `apps/web/src/features/models/detail/model-detail-settings-tab.tsx` to consume the new controller shape, then run the full DoD.

### Steps

1. Open `apps/web/src/features/models/detail/model-detail-settings-tab.tsx` (39 lines today).
2. The current file calls `useModelConfigPageFromContext()` and passes individual props to `<ModelConfigForm>`. Replace the props with a single `controller={controller}` prop:

```tsx
import { ModelConfigForm } from "../components/model-config-form";
import { useModelConfigPageFromContext } from "../use-model-config-page";

export function ModelDetailSettingsTab() {
  const controller = useModelConfigPageFromContext();
  return <ModelConfigForm controller={controller} />;
}
```

3. Remove now-unused imports (`modelName`, `formData`, `providers`, callbacks) from the settings tab file.
4. Run `pnpm --filter @lite-llm/web typecheck` — exit 0.
5. Run `pnpm --filter @lite-llm/web lint` — exit 0.
6. Run `pnpm --filter @lite-llm/web test` — all green.
7. Smoke check: open `/models/<sample-model>/settings` in a browser (or via Playwright if available) and confirm the three tabs render, General is open by default, Reasoning is collapsed, Save is disabled until a change is made.

### Verification

- All three DoD commands green.
- Manual smoke check passed.

