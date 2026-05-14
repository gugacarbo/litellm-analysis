# Design: Model Enabled/Disabled Toggle

## Overview

Adicionar toggle de enabled/disabled para modelos na página `/models`, permitindo ativar/desativar modelos rapidamente tanto na tabela quanto no formulário de edição.

## Motivation

O campo `enabled` já existe no schema Zod (`repositories/models-repository/src/schemas/model.ts`) com descrição: "Whether this model is enabled for routing and selection". No entanto, não há interface para manipulá-lo.

## Design

### 1. Backend (API)

**Endpoint:** `PUT /models/:name` existente

**Body atualizado:**
```typescript
{
  litellmParams: Record<string, unknown>;
  modelName?: string; // renomear
  enabled?: boolean;  // NOVO - toggle rápido
}
```

**Persistência:** Campo `enabled` no JSONC `@models/models.jsonc`

### 2. Frontend - Tipos

**`apps/web/src/lib/api-client/models.ts`:**
```typescript
export type ModelConfig = {
  modelName: string;
  litellmParams: Record<string, unknown>;
  enabled?: boolean;
};
```

**`apps/web/src/pages/models/model-form-data.ts`:**
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

### 3. Tabela (`ModelsTableCard`)

**Local:** `apps/web/src/components/models/models-table-card.tsx`

**Coluna "Enabled":**
- Switch (shadcn/ui `Switch` component)
- Toggle rápido sem abrir dialog
- Mutação direta via API

**Visual para disabled:**
- `TableRow` com `className="opacity-50"`
- Badge variant `destructive` com texto "Disabled"

### 4. Formulário (`ModelFormDialog`)

**Local:** `apps/web/src/components/models/model-form-dialog.tsx`

**Novo campo:**
```tsx
<div className="flex items-center space-x-2">
  <Switch
    id="enabled"
    checked={formData.enabled}
    onCheckedChange={(checked) => 
      onFormDataChange({ ...formData, enabled: checked })
    }
  />
  <Label htmlFor="enabled" className="text-sm">
    Enabled for routing
  </Label>
</div>
<p className="text-xs text-muted-foreground">
  Disable to hide from routing
</p>
```

### 5. Hooks

**`apps/web/src/pages/models/models-form-utils.ts`:**
- `mapModelToFormData`: extrair `enabled` de `litellmParams`
- `validateAndBuildModelParams`: incluir `enabled` no params de saída

**`apps/web/src/pages/models/use-models-form-state.ts`:**
- `EMPTY_MODEL_FORM_DATA`: adicionar `enabled: true`

### 6. API Client

**`apps/web/src/lib/api-client/models.ts`:**
```typescript
export async function updateModel(
  modelName: string,
  litellmParams: Record<string, unknown>,
  newName?: string,
  enabled?: boolean,
): Promise<{ success: boolean }>
```

### 7. Hook da Página

**`apps/web/src/pages/models/use-models-page.ts`:**
- Adicionar `handleToggleEnabled` para toggle rápido na tabela
- Criar mutação separada para toggle (sem abrir dialog)

## Files to Modify

1. `packages/server-core/src/routes/model-routes.ts` - Backend API
2. `apps/web/src/lib/api-client/models.ts` - API client types
3. `apps/web/src/pages/models/model-form-data.ts` - Form data type
4. `apps/web/src/pages/models/models-form-utils.ts` - Utils
5. `apps/web/src/pages/models/use-models-form-state.ts` - Form state
6. `apps/web/src/pages/models/use-models-page.ts` - Page hook
7. `apps/web/src/pages/models.tsx` - Page component
8. `apps/web/src/components/models/models-table-card.tsx` - Table UI
9. `apps/web/src/components/models/model-form-dialog.tsx` - Form UI

## Visual

**Tabela:**
```
| Model Name  | Enabled    | Status           | Health | ...
| gpt-4       | [●━━━━━]  | Synced           | ✓     | ...
| gpt-3.5     | [━●━━━━]  | [Badge:Disabled] | —     | ... (opacity-50)
```

**Formulário:**
```
Model Name
[___________]

[●] Enabled for routing
    Disable to hide from routing

API Base URL
[___________]
...
```
