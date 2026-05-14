# LiteLLM Alias Plugin Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fine-grained agent/category selection to LitellmAliasPlugin with master toggles and per-item selection.

**Architecture:** Plugin config is stored in `routing.config` (accessed as `routing.config ?? {}`) and read via `buildOutput()`. No new interfaces needed.

**Tech Stack:** TypeScript (agents-manager package)

---

## Files

**Modify:** `packages/agents-manager/src/plugins/external/litellm-alias.plugin.ts`

---

## Task 1: Update config schema

**Files:** Modify: `packages/agents-manager/src/plugins/external/litellm-alias.plugin.ts:getConfigSchema`

- [ ] **Step 1: Replace getConfigSchema() with 6 fields**

```typescript
getConfigSchema(): ConfigField[] {
  return [
    {
      key: "aliasPrefix",
      type: "string",
      label: "Alias Prefix",
      required: false,
      default: "",
      placeholder: "e.g. prod:",
      description: "Text prepended to all generated alias names",
    },
    {
      key: "includeAgents",
      type: "boolean",
      label: "Include Agents",
      required: false,
      default: true,
      description: "Master toggle for agent-based aliases",
    },
    {
      key: "selectedAgents",
      type: "string",
      label: "Selected Agents",
      required: false,
      default: "",
      placeholder: "Comma-separated agent IDs, e.g. coder,planner",
      description: "Which agents to include (empty = all). Comma-separated list.",
    },
    {
      key: "includeCategories",
      type: "boolean",
      label: "Include Categories",
      required: false,
      default: true,
      description: "Master toggle for category-based aliases",
    },
    {
      key: "selectedCategories",
      type: "string",
      label: "Selected Categories",
      required: false,
      default: "",
      placeholder: "Comma-separated category keys, e.g. coding,debugging",
      description: "Which categories to include (empty = all). Comma-separated list.",
    },
    {
      key: "globalFallbackOverride",
      type: "string",
      label: "Global Fallback Override",
      required: false,
      default: "",
      placeholder: "e.g. gpt-4o-mini",
      description: "Override global fallback model (empty = use default)",
    },
  ];
}
```

**Note:** `selectedAgents` and `selectedCategories` use `type: "string"` with comma-separated values because the existing `PluginConfigForm` only supports single-select. The frontend will populate these fields using the agent/category catalog.

---

## Task 2: Update buildOutput to respect selected agents/categories

**Files:** Modify: `packages/agents-manager/src/plugins/external/litellm-alias.plugin.ts:buildOutput`

- [ ] **Step 1: Read all config values at start of buildOutput**

Add after the existing config reads:
```typescript
// Parse comma-separated lists into arrays (empty string = all)
const selectedAgentsRaw = (config.selectedAgents as string) ?? "";
const selectedCategoriesRaw = (config.selectedCategories as string) ?? "";
const selectedAgentsSet = selectedAgentsRaw
  ? new Set(selectedAgentsRaw.split(",").map((s) => s.trim()).filter(Boolean))
  : null; // null = all
const selectedCategoriesSet = selectedCategoriesRaw
  ? new Set(selectedCategoriesRaw.split(",").map((s) => s.trim()).filter(Boolean))
  : null; // null = all
```

- [ ] **Step 2: Add agent filter condition in the agent loop**

Wrap the `for (const agent of agents...)` loop body with:
```typescript
// Skip agents not in selectedAgentsSet (when not null)
if (selectedAgentsSet && !selectedAgentsSet.has(agent.id)) {
  continue;
}
```

- [ ] **Step 3: Add category filter condition in the category loop**

In the category loop, after checking `enabledCategories[key]`, add:
```typescript
// Skip categories not in selectedCategoriesSet (when not null)
if (selectedCategoriesSet && !selectedCategoriesSet.has(key)) {
  continue;
}
```

- [ ] **Step 4: Verify effectiveFallback is used throughout**

Ensure all `generateLitellmAliases` calls use `effectiveFallback` instead of `globalFallback`.

---

## Task 3: Verify build

- [ ] **Step 1: Run typecheck**

```bash
cd /home/gustavo_carbonera/Apps/litellm-analysis
pnpm --filter @lite-llm/agents-manager typecheck
```

Expected: No TypeScript errors

- [ ] **Step 2: Run lint**

```bash
npx biome check packages/agents-manager/src/plugins/external/litellm-alias.plugin.ts
```

Expected: No lint errors

---

## Verification Checklist

- [ ] `getConfigSchema()` returns 6 fields matching the spec
- [ ] `buildOutput()` reads `selectedAgents` and `selectedCategories` from config
- [ ] `selectedAgentsSet === null` means include all agents
- [ ] `selectedAgentsSet` non-null filters to only those agent IDs
- [ ] `selectedCategoriesSet === null` means include all categories
- [ ] `selectedCategoriesSet` non-null filters to only those category keys
- [ ] Master toggles (`includeAgents`, `includeCategories`) still work
- [ ] TypeScript compiles without errors
