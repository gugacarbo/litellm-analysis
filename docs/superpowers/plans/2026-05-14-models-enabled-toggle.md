# Model Enabled/Disabled Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add enabled/disabled toggle for models in the `/models` page, with quick switch in table and form dialog.

**Architecture:** Backend modifies existing PUT endpoint to accept `enabled` field. Frontend adds Switch component to both table (for quick toggle) and form dialog. Disabled models show with opacity and badge.

**Tech Stack:** React 19, TypeScript, shadcn/ui Switch, Express.js backend, JSONC config persistence.

---

## Task 1: Backend API - Update PUT endpoint

**Files:**
- Modify: `packages/server-core/src/routes/model-routes.ts`

- [ ] **Step 1: Read current model-routes.ts**

Read the file to understand the current `updateModel` function implementation.

- [ ] **Step 2: Update PUT handler to accept enabled field**

In the PUT handler for `/models/:name`, accept `{ enabled?: boolean }` in the body. Persist the `enabled` field to `@models/models.jsonc`.

The existing `updateModel` function in `models-manager` should already handle this if `litellmParams` contains `enabled` key.

- [ ] **Step 3: Verify the change**

Run: `pnpm --filter @lite-llm/server-core typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/server-core/src/routes/model-routes.ts
git commit -m "feat(api): accept enabled field in PUT /models/:name"
```

---

## Task 2: Frontend Types - Add enabled to ModelConfig

**Files:**
- Modify: `apps/web/src/lib/api-client/models.ts`

- [ ] **Step 1: Read current models.ts**

Read the file to see current `ModelConfig` and `updateModel` signatures.

- [ ] **Step 2: Add enabled field to ModelConfig**

```typescript
export type ModelConfig = {
  modelName: string;
  litellmParams: Record<string, unknown>;
  enabled?: boolean;
};
```

- [ ] **Step 3: Update updateModel function signature**

```typescript
export async function updateModel(
  modelName: string,
  litellmParams: Record<string, unknown>,
  newName?: string,
  enabled?: boolean,
): Promise<{ success: boolean }>
```

- [ ] **Step 4: Verify types**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors (may need other tasks to complete)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api-client/models.ts
git commit -m "feat(types): add enabled field to ModelConfig"
```

---

## Task 3: Form Data Type - Add enabled to ModelFormData

**Files:**
- Modify: `apps/web/src/pages/models/model-form-data.ts`

- [ ] **Step 1: Read current model-form-data.ts**

Read to understand current `ModelFormData` structure.

- [ ] **Step 2: Add enabled field to ModelFormData**

```typescript
export type ModelFormData = {
  modelName: string;
  apiBase: string;
  inputCostPerToken: string;
  outputCostPerToken: string;
  contextWindowSize: string;
  maxTokens: string;
  litellmCredentialName: string;
  extraParams: Record<string, string>;
  enabled: boolean; // NOVO
};
```

- [ ] **Step 3: Update EMPTY_MODEL_FORM_DATA**

```typescript
export const EMPTY_MODEL_FORM_DATA: ModelFormData = {
  modelName: "",
  apiBase: "",
  inputCostPerToken: "",
  outputCostPerToken: "",
  contextWindowSize: "",
  maxTokens: "",
  litellmCredentialName: "",
  extraParams: {},
  enabled: true, // NOVO - default true
};
```

- [ ] **Step 4: Verify types**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/models/model-form-data.ts
git commit -m "feat(models): add enabled field to ModelFormData"
```

---

## Task 4: Form Utils - Map enabled field

**Files:**
- Modify: `apps/web/src/pages/models/models-form-utils.ts`

- [ ] **Step 1: Read current models-form-utils.ts**

Read to see current `mapModelToFormData` and `validateAndBuildModelParams`.

- [ ] **Step 2: Update mapModelToFormData to extract enabled**

```typescript
export function mapModelToFormData(model: ModelConfig): ModelFormData {
  const params = model.litellmParams || {};
  const extraParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (!FIXED_KEYS.includes(key)) {
      extraParams[key] = String(value ?? "");
    }
  });

  return {
    modelName: model.modelName,
    apiBase: (params.api_base as string) || "",
    inputCostPerToken: params.input_cost_per_token?.toString() || "",
    outputCostPerToken: params.output_cost_per_token?.toString() || "",
    contextWindowSize: params.context_window_size?.toString() || "",
    maxTokens: params.max_tokens?.toString() || "",
    litellmCredentialName: (params.litellm_credential_name as string) || "",
    extraParams,
    enabled: (params.enabled as boolean) ?? true, // NOVO
  };
}
```

- [ ] **Step 3: Update validateAndBuildModelParams to include enabled**

At the end of the function (before `return { params }`), add:

```typescript
params.enabled = formData.enabled;

return { params };
```

- [ ] **Step 4: Verify types**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/models/models-form-utils.ts
git commit -m "feat(models): map enabled field in form utils"
```

---

## Task 5: Table Component - Add Switch column

**Files:**
- Modify: `apps/web/src/components/models/models-table-card.tsx`

- [ ] **Step 1: Read current models-table-card.tsx**

Read to understand table structure and how models are rendered.

- [ ] **Step 2: Add Switch import**

```typescript
import { Switch } from "../ui/switch";
```

- [ ] **Step 3: Add handleToggleEnabled prop to Props**

```typescript
type ModelsTableCardProps = {
  // ... existing props
  onToggleEnabled: (modelName: string, enabled: boolean) => void;
};
```

- [ ] **Step 4: Add to destructured props**

```typescript
export function ModelsTableCard({
  models,
  loading,
  error,
  deleteModelName,
  modelsHealth = [],
  addToConfigPending,
  onDeleteModelNameChange,
  onOpenEdit,
  onDelete,
  onAddToConfig,
  onToggleEnabled, // NOVO
}: ModelsTableCardProps) {
```

- [ ] **Step 5: Add Enabled column header**

In `<TableHeader>`, after `<TableHead>Model Name</TableHead>`:

```tsx
<TableHead>Enabled</TableHead>
```

- [ ] **Step 6: Add Switch cell in each row**

In the `<TableRow>` for each model, after `<TableCell className="font-medium">`:

```tsx
<TableCell>
  <Switch
    checked={model.enabled !== false}
    onCheckedChange={(checked) => onToggleEnabled(model.modelName, checked)}
    onClick={(e) => e.stopPropagation()}
  />
</TableCell>
```

- [ ] **Step 7: Add disabled visual styling**

In the `<TableRow>` wrapper, conditionally add opacity:

```tsx
<TableRow
  key={model.modelName}
  className={model.enabled === false ? "opacity-50" : undefined}
>
```

- [ ] **Step 8: Update Status cell for disabled models**

Replace or augment the status Badge for disabled models:

```tsx
<TableCell>
  {model.enabled === false ? (
    <Badge variant="destructive">Disabled</Badge>
  ) : (
    <Badge variant={statusBadgeVariant[model.status] ?? "outline"}>
      {statusLabel[model.status] ?? model.status}
    </Badge>
  )}
</TableCell>
```

- [ ] **Step 9: Verify compilation**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/components/models/models-table-card.tsx
git commit -m "feat(table): add enabled switch column with disabled styling"
```

---

## Task 6: Form Dialog - Add Switch

**Files:**
- Modify: `apps/web/src/components/models/model-form-dialog.tsx`

- [ ] **Step 1: Read current model-form-dialog.tsx**

Read to understand form structure.

- [ ] **Step 2: Add Switch import**

```typescript
import { Switch } from "../ui/switch";
```

- [ ] **Step 3: Add enabled Switch after Model Name field**

After the Model Name `<div>` (line ~92), add:

```tsx
<div className="flex items-center space-x-2">
  <Switch
    id="enabled"
    checked={formData.enabled}
    onCheckedChange={(checked) =>
      onFormDataChange({ ...formData, enabled: checked })
    }
  />
  <Label htmlFor="enabled" className="text-sm font-medium cursor-pointer">
    Enabled for routing
  </Label>
</div>
<p className="text-xs text-muted-foreground -mt-1">
  Disable to hide from routing
</p>
```

- [ ] **Step 4: Verify compilation**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/models/model-form-dialog.tsx
git commit -m "feat(form): add enabled switch to model form dialog"
```

---

## Task 7: Page Hook - Add toggle handler

**Files:**
- Modify: `apps/web/src/pages/models/use-models-page.ts`

- [ ] **Step 1: Read current use-models-page.ts**

Read to understand current mutation handlers.

- [ ] **Step 2: Add toggle enabled mutation**

Add a new mutation for quick toggle:

```typescript
const toggleEnabledMutation = useMutation({
  mutationFn: async ({
    modelName,
    enabled,
  }: {
    modelName: string;
    enabled: boolean;
  }) => {
    const model = modelsQuery.data?.models.find(
      (m) => m.modelName === modelName,
    );
    if (!model) throw new Error("Model not found");
    
    const params = { ...model.litellmParams, enabled };
    await updateModel(modelName, params);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["models-with-config"] });
  },
});
```

- [ ] **Step 3: Add handleToggleEnabled function**

```typescript
const handleToggleEnabled = (modelName: string, enabled: boolean) => {
  toggleEnabledMutation.mutate({ modelName, enabled });
};
```

- [ ] **Step 4: Add to return object**

```typescript
return {
  // ... existing return values
  handleToggleEnabled,
};
```

- [ ] **Step 5: Verify compilation**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/models/use-models-page.ts
git commit -m "feat(hook): add toggle enabled mutation and handler"
```

---

## Task 8: Page Component - Pass props to table

**Files:**
- Modify: `apps/web/src/pages/models.tsx`

- [ ] **Step 1: Read current models.tsx**

Read to see how `ModelsTableCard` is used.

- [ ] **Step 2: Pass onToggleEnabled to ModelsTableCard**

In the `<ModelsTableCard>` component call, add:

```tsx
<ModelsTableCard
  models={models}
  loading={modelsQuery.isPending && !modelsQuery.data}
  modelsHealth={modelsHealth}
  error={
    mutationError ||
    (modelsQuery.error ? String(modelsQuery.error) : null)
  }
  deleteModelName={deleteModelName}
  addToConfigPending={addToConfigPending}
  onDeleteModelNameChange={setDeleteModelName}
  onOpenEdit={handleOpenEdit}
  onDelete={handleDelete}
  onAddToConfig={handleAddToConfig}
  onToggleEnabled={handleToggleEnabled} // NOVO
/>
```

- [ ] **Step 3: Verify compilation**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/models.tsx
git commit -m "feat(page): wire up toggle enabled handler to table"
```

---

## Task 9: Test - Verify end-to-end

**Files:**
- Run: Manual testing or add automated tests

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Navigate to /models**

Open http://localhost:5178/models

- [ ] **Step 3: Test table toggle**

Find a model, click the Switch in the Enabled column. Verify:
- Model row becomes opacity-50
- Status shows "Disabled" badge
- Refreshing page keeps the state

- [ ] **Step 4: Test form toggle**

Click Edit on a model. Verify:
- Enabled switch is present
- Can toggle and save
- Changes persist

- [ ] **Step 5: Verify backend**

Check `@models/models.jsonc` contains `"enabled": false` for disabled models.

- [ ] **Step 6: Commit final test results**

```bash
git add -A
git commit -m "test: verify enabled toggle works end-to-end"
```

---

## Summary

| Task | File | Changes |
|------|------|---------|
| 1 | Backend API | Accept enabled field in PUT |
| 2 | API Types | Add enabled to ModelConfig |
| 3 | Form Data | Add enabled to ModelFormData |
| 4 | Form Utils | Map enabled field |
| 5 | Table | Add Switch column |
| 6 | Form Dialog | Add Switch |
| 7 | Page Hook | Add toggle mutation |
| 8 | Page | Wire up handler |

