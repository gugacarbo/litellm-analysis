# Model Thinking Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `thinking` configuration (`type: "enabled" | "disabled"`, `budgetTokens: number`) to model entries in `@models/models.jsonc` and the models-repository schema, enabling per-model extended thinking control.

**Architecture:** `thinkingSchema` lives in `repositories/models-repository/src/schemas/thinking.ts` (models domain owns model behavior config). The agents-repository keeps its own copy for category-level thinking. The `modelSpecSchema` gains an optional `thinking` field defaulting to `{ type: "disabled", budgetTokens: 0 }`. Models that support extended thinking (deepseek family, kimi, etc.) get `thinking: { type: "enabled", budgetTokens: N }` in the JSONC data.

**Tech Stack:** TypeScript, Zod, Vitest, JSONC, Turborepo.

---

### Task 1: Add thinkingSchema to models-repository

**Files:**
- Create: `repositories/models-repository/src/schemas/thinking.ts`
- Modify: `repositories/models-repository/src/schemas/index.ts`

- [ ] **Step 1: Create thinking.ts schema file**

```ts
// repositories/models-repository/src/schemas/thinking.ts
import { z } from "zod";

export const thinkingSchema = z.object({
  type: z
    .enum(["enabled", "disabled"])
    .default("disabled")
    .meta({ title: "Type", description: "Thinking mode type" }),
  budgetTokens: z
    .number()
    .default(0)
    .meta({ title: "Budget Tokens", description: "Token budget for thinking" })
    .optional(),
});

export type ThinkingConfig = z.infer<typeof thinkingSchema>;
```

- [ ] **Step 2: Export from schema index**

```ts
// repositories/models-repository/src/schemas/index.ts — add these lines:
export type { ThinkingConfig } from "./thinking.js";
export { thinkingSchema } from "./thinking.js";
```

Current exports:
```ts
export type { Cost, ModelSpec } from "./model.js";
export { costSchema, modelSpecSchema } from "./model.js";
export type { ModelsConfig } from "./models-config.js";
export { modelsConfigSchema } from "./models-config.js";
export type { Provider } from "./provider.js";
export { providerSchema } from "./provider.js";
```

After edit:
```ts
export type { Cost, ModelSpec } from "./model.js";
export { costSchema, modelSpecSchema } from "./model.js";
export type { ModelsConfig } from "./models-config.js";
export { modelsConfigSchema } from "./models-config.js";
export type { Provider } from "./provider.js";
export { providerSchema } from "./provider.js";
export type { ThinkingConfig } from "./thinking.js";
export { thinkingSchema } from "./thinking.js";
```

- [ ] **Step 3: Run typecheck on models-repository**

```bash
pnpm --filter @lite-llm/models-repository typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add repositories/models-repository/src/schemas/thinking.ts repositories/models-repository/src/schemas/index.ts
git commit -m "feat(models-repository): add thinking schema for model extended thinking config"
```

---

### Task 2: Add thinking field to modelSpecSchema

**Files:**
- Modify: `repositories/models-repository/src/schemas/model.ts`

- [ ] **Step 1: Write a test for thinking field on model schema**

```ts
// repositories/models-repository/src/repository/repository.test.ts
// Add this test case inside the existing describe block for model validation:

describe("model thinking config", () => {
  it("rejects thinking with invalid type", async () => {
    await expect(
      repo.write({
        $schema: "",
        version: 1,
        provider: {},
        models: {
          test: {
            displayName: "Test Model",
            limits: { length: 4096, maxOutput: 1024 },
            thinking: { type: "invalid", budgetTokens: 100 },
          },
        },
      }),
    ).rejects.toThrow();
  });

  it("accepts model without thinking (uses default)", async () => {
    await repo.write({
      $schema: "",
      version: 1,
      provider: {},
      models: {
        test: {
          displayName: "Test Model",
          limits: { length: 4096, maxOutput: 1024 },
        },
      },
    });

    const config = await repo.read();
    expect(config.models.test?.thinking).toEqual({
      type: "disabled",
      budgetTokens: 0,
    });
  });

  it("accepts model with thinking enabled", async () => {
    await repo.write({
      $schema: "",
      version: 1,
      provider: {},
      models: {
        test: {
          displayName: "Test Model",
          limits: { length: 4096, maxOutput: 1024 },
          thinking: { type: "enabled", budgetTokens: 8000 },
        },
      },
    });

    const config = await repo.read();
    expect(config.models.test?.thinking).toEqual({
      type: "enabled",
      budgetTokens: 8000,
    });
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

```bash
pnpm --filter @lite-llm/models-repository test -- -t "thinking"
```

Expected: first test passes (rejects invalid), second and third fail because valid models with `thinking` field are rejected by `.strict()` since `thinking` is not in the schema yet.

- [ ] **Step 3: Modify model.ts to add thinking field**

```ts
// repositories/models-repository/src/schemas/model.ts
import { z } from "zod";
import { thinkingSchema } from "./thinking.js";

export const costSchema = z.object({
  input: z
    .number()
    .default(0)
    .meta({ title: "Input Cost", description: "Cost per million input tokens" })
    .optional(),
  output: z
    .number()
    .default(0)
    .meta({
      title: "Output Cost",
      description: "Cost per million output tokens",
    })
    .optional(),
});

export type Cost = z.infer<typeof costSchema>;

export const modelSpecSchema = z
  .object({
    enabled: z.boolean().optional().default(true).meta({
      title: "Enabled",
      description: "Whether this model is enabled for routing and selection",
    }),
    displayName: z.string().meta({
      title: "Display Name",
      description: "Human-readable name for the model",
    }),
    family: z
      .string()
      .optional()
      .meta({ title: "Family", description: "Model family" }),
    limits: z
      .object({
        length: z
          .number()
          .meta({
            title: "Context Length",
            description: "Maximum context window size in tokens",
          })
          .default(200000),
        maxOutput: z
          .number()
          .meta({ title: "Max Output", description: "Maximum output tokens" })
          .default(32768),
      })
      .meta({ title: "Limits", description: "Model limits" }),
    cost: costSchema.optional().meta({
      title: "Cost",
      description: "Model pricing per million tokens",
    }),
    thinking: thinkingSchema
      .default({ type: "disabled", budgetTokens: 0 })
      .optional()
      .meta({
        title: "Thinking",
        description: "Extended thinking configuration for this model",
      }),
  })
  .strict();

export type ModelSpec = z.infer<typeof modelSpecSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @lite-llm/models-repository test
```

Expected: all PASS (including the new thinking tests).

- [ ] **Step 5: Run typecheck**

```bash
pnpm --filter @lite-llm/models-repository typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add repositories/models-repository/src/schemas/model.ts repositories/models-repository/src/repository/repository.test.ts
git commit -m "feat(models-repository): add thinking field to modelSpecSchema"
```

---

### Task 3: Update @models/models.jsonc with thinking config

**Files:**
- Modify: `@models/models.jsonc`

- [ ] **Step 1: Add thinking field to reasoning-capable models**

Models that support extended thinking: `deepseek-v4-pro`, `deepseek-v4-flash`, `kimi-k2.6`, `glm-5`, `glm-5.1`, `glm-5-turbo`.

```jsonc
// @models/models.jsonc — modify the models block to add thinking:

"models": {
  "glm-5": {
    "enabled": true,
    "displayName": "GLM-5",
    "family": "z.ai",
    "limits": { "length": 200000, "maxOutput": 128000 },
    "cost": { "input": 1.00, "output": 3.20 },
    "thinking": { "type": "enabled", "budgetTokens": 16000 }
  },
  "glm-5.1": {
    "enabled": true,
    "displayName": "GLM-5.1",
    "family": "z.ai",
    "limits": { "length": 200000, "maxOutput": 128000 },
    "cost": { "input": 1.40, "output": 4.40 },
    "thinking": { "type": "enabled", "budgetTokens": 16000 }
  },
  "glm-5-turbo": {
    "enabled": true,
    "displayName": "GLM-5 Turbo",
    "family": "z.ai",
    "limits": { "length": 200000, "maxOutput": 128000 },
    "cost": { "input": 1.20, "output": 4.00 },
    "thinking": { "type": "enabled", "budgetTokens": 8000 }
  },
  // ... other models unchanged (they don't get thinking or get { type: "disabled", budgetTokens: 0 })
  "deepseek-v4-flash": {
    "enabled": true,
    "displayName": "DeepSeek V4 Flash",
    "family": "deepseek",
    "limits": { "length": 1048576, "maxOutput": 384000 },
    "cost": { "input": 0.14, "output": 0.28 },
    "thinking": { "type": "enabled", "budgetTokens": 32000 }
  },
  "deepseek-v4-pro": {
    "enabled": true,
    "displayName": "DeepSeek V4 Pro",
    "family": "deepseek",
    "limits": { "length": 1048576, "maxOutput": 384000 },
    "cost": { "input": 1.74, "output": 3.48 },
    "thinking": { "type": "enabled", "budgetTokens": 32000 }
  },
  "kimi-k2.6": {
    "enabled": true,
    "displayName": "Kimi K2.6",
    "family": "moonshot",
    "limits": { "length": 262144, "maxOutput": 32768 },
    "cost": { "input": 0.95, "output": 4.00 },
    "thinking": { "type": "enabled", "budgetTokens": 32000 }
  }
  // qwen3.5-plus, qwen3-coder-plus, MiniMax-M2.7-highspeed, glm-5.1:ollama,
  // mimo-v2.5-pro, mimo-v2-pro — no thinking (leave as-is, defaults to disabled)
}
```

- [ ] **Step 2: Validate JSONC parses correctly**

```bash
pnpm --filter @lite-llm/models-repository test
```

Expected: existing tests that read the config should still pass. The new thinking fields must not cause `.strict()` rejection since they're now in the schema.

- [ ] **Step 3: Commit**

```bash
git add @models/models.jsonc
git commit -m "feat(models): add thinking config to reasoning-capable models"
```

---

### Task 4: Regenerate @models/models.schema.json

**Files:**
- Modify: `@models/models.schema.json`

- [ ] **Step 1: Find the schema generation script**

```bash
grep -r "models.schema" scripts/ --include="*.ts" -l
grep -r "zod-to-json" packages/ --include="*.ts" -l
```

If a generation script exists, use it. Otherwise, manually update the JSON schema.

- [ ] **Step 2: Manually add thinking property to model sub-schema**

If no generation script is found, add the `thinking` property to the models additionalProperties in `@models/models.schema.json`:

In the `models` > `additionalProperties` section, add after the `cost` property:

```json
"thinking": {
  "default": {
    "type": "disabled",
    "budgetTokens": 0
  },
  "title": "Thinking",
  "description": "Extended thinking configuration for this model",
  "type": "object",
  "properties": {
    "type": {
      "default": "disabled",
      "title": "Type",
      "description": "Thinking mode type",
      "type": "string",
      "enum": ["enabled", "disabled"]
    },
    "budgetTokens": {
      "default": 0,
      "title": "Budget Tokens",
      "description": "Token budget for thinking",
      "type": "number"
    }
  },
  "required": ["type"],
  "additionalProperties": false
}
```

- [ ] **Step 3: Validate the JSON schema itself**

```bash
npx ajv validate -s @models/models.schema.json -d @models/models.jsonc
```

Or use a Node script:
```bash
node -e "const s = require('./@models/models.schema.json'); console.log('Schema valid:', !!s)" 
```

- [ ] **Step 4: Commit**

```bash
git add @models/models.schema.json
git commit -m "chore(models-schema): add thinking property to model schema"
```

---

### Task 5: Clean up agents-repository leftovers

**Files:**
- Delete: `repositories/agents-repository/src/schemas/model.ts`
- Delete: `repositories/agents-repository/src/schemas/cost.ts`
- Modify: `repositories/agents-repository/src/schemas/index.ts`
- Modify: `repositories/agents-repository/src/schemas/category.ts` (optional — see notes)

- [ ] **Step 1: Check what imports model.ts and cost.ts from agents-repository**

```bash
grep -r "from.*\.\/model\.js" repositories/agents-repository/src/ --include="*.ts"
grep -r "from.*\.\/cost\.js" repositories/agents-repository/src/ --include="*.ts"
grep -r "ModelSpec.*agents-repository" packages/ --include="*.ts" -l
grep -r "modelSpecSchema.*agents-repository" packages/ --include="*.ts" -l
```

The `db-config.ts` in agents-repository no longer imports from `./model.js` (confirmed: it only imports `categoryEntrySchema`, `pluginRoutingSchema`, `systemAgentSchema`). If no other files in agents-repository import from `./model.js` or `./cost.js`, they can be safely removed.

For external consumers: check if any package imports `ModelSpec` or `modelSpecSchema` from `@lite-llm/agents-repository` instead of `@lite-llm/models-repository`.

- [ ] **Step 2: Remove model.ts and cost.ts from agents-repository**

If no consumers found in Step 1:

```bash
rm repositories/agents-repository/src/schemas/model.ts
rm repositories/agents-repository/src/schemas/cost.ts
```

- [ ] **Step 3: Update agents-repository schema index**

Remove these lines from `repositories/agents-repository/src/schemas/index.ts`:

```ts
// Remove these lines:
export type { Cost } from "./cost.js";
export { costSchema } from "./cost.js";
export type { ModelSpec } from "./model.js";
export { modelSpecSchema } from "./model.js";
```

- [ ] **Step 4: Verify category.ts thinking import still works**

The `category.ts` currently imports `thinkingSchema` from `./thinking.js` (same directory). Since we're NOT removing `thinking.ts` from agents-repository (categories still need it), this import remains valid.

- [ ] **Step 5: Run agents-repository typecheck and tests**

```bash
pnpm --filter @lite-llm/agents-repository typecheck
pnpm --filter @lite-llm/agents-repository test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add repositories/agents-repository/src/schemas/index.ts
git rm repositories/agents-repository/src/schemas/model.ts repositories/agents-repository/src/schemas/cost.ts
git commit -m "refactor(agents-repository): remove duplicate model and cost schemas"
```

---

### Task 6: Update agents.schema.json (if needed)

**Files:**
- Modify: `@agents/agents.schema.json` (only if it still contains a model sub-schema)

- [ ] **Step 1: Check if agents.schema.json has model definitions**

```bash
grep -c '"models"' @agents/agents.schema.json
```

If output is `0`, the schema is already clean — no action needed. Skip to Step 4.

If output is `> 0`, the schema needs cleanup.

- [ ] **Step 2: Remove model sub-schema from agents.schema.json** (only if needed)

Remove the `"models"` property and its associated `modelSpecSchema` definition from `@agents/agents.schema.json`.

- [ ] **Step 3: Validate updated agents.schema.json**

```bash
node -e "const s = require('./@agents/agents.schema.json'); console.log('Schema valid:', !!s)"
```

- [ ] **Step 4: Commit** (or skip if no changes)

```bash
git add @agents/agents.schema.json
git commit -m "chore(agents-schema): remove stale model sub-schema after split"
```

---

### Task 7: Full verification

**No file changes — verification only.**

- [ ] **Step 1: Typecheck all affected packages**

```bash
pnpm --filter @lite-llm/models-repository typecheck
pnpm --filter @lite-llm/models-manager typecheck
pnpm --filter @lite-llm/agents-repository typecheck
pnpm --filter @lite-llm/agents-manager typecheck
pnpm --filter @lite-llm/server-core typecheck
pnpm --filter @lite-llm/analytics typecheck
```

Expected: all PASS.

- [ ] **Step 2: Run tests for affected packages**

```bash
pnpm --filter @lite-llm/models-repository test
pnpm --filter @lite-llm/models-manager test
pnpm --filter @lite-llm/agents-repository test
pnpm --filter @lite-llm/agents-manager test
```

Expected: all PASS.

- [ ] **Step 3: Workspace-wide validation**

```bash
pnpm typecheck
pnpm test
pnpm lint
```

Expected: all PASS.

- [ ] **Step 4: Build**

```bash
pnpm build
```

Expected: all packages build successfully.

---

### Task 8: UI — Thinking selector on model editor (future)

> **Note:** This task is a placeholder. The UI is a separate concern. Implement in a follow-up plan when the backend/data layer is stable.

**Scope:**
- Add a `ThinkingToggle` component (toggle + numeric input for `budgetTokens`) to the model editing form
- The component reads `model.thinking.type` and `model.thinking.budgetTokens` from the model data
- On save, it writes the updated thinking config back via the models-manager API
- Components live in `apps/web/src/components/` 
- Pages live in `apps/web/src/pages/`

**Files (tentative):**
- Create: `apps/web/src/components/thinking-toggle.tsx`
- Modify: `apps/web/src/pages/models-manager/` (or wherever model editing UI lives)

---

## Summary

| Task | What | Creates/Modifies |
|------|------|-----------------|
| 1 | Add `thinkingSchema` to models-repository | New file: `thinking.ts`; modify: `index.ts` |
| 2 | Add `thinking` field to `modelSpecSchema` | Modify: `model.ts`, `repository.test.ts` |
| 3 | Add thinking config to `@models/models.jsonc` | Modify: `models.jsonc` (6 models get thinking) |
| 4 | Regenerate `@models/models.schema.json` | Modify: JSON schema |
| 5 | Clean up agents-repository leftovers | Delete: `model.ts`, `cost.ts`; modify: `index.ts` |
| 6 | Clean up `@agents/agents.schema.json` if needed | Conditional |
| 7 | Full verification | None (read-only) |
| 8 | UI thinking selector | Future plan |
