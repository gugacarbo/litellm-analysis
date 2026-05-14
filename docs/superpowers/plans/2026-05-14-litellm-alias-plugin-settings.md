# LiteLLM Alias Plugin Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 configuration options to LitellmAliasPlugin (aliasPrefix, includeAgents, includeCategories, globalFallbackOverride) and update buildOutput to respect them.

**Architecture:** Plugin config is stored in `routing.config` (accessed as `routing.config ?? {}`) and read via `buildOutput()`. No new interfaces needed — existing `TransformContext` and `IPlugin` are sufficient.

**Tech Stack:** TypeScript (agents-manager package)

---

## Files

**Modify:** `packages/agents-manager/src/plugins/external/litellm-alias.plugin.ts`

---

## Task 1: Add config schema

- [ ] **Step 1: Update `getConfigSchema()` to return 4 fields**

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
      description: "Include agent-based aliases in output",
    },
    {
      key: "includeCategories",
      type: "boolean",
      label: "Include Categories",
      required: false,
      default: true,
      description: "Include category-based aliases in output",
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

---

## Task 2: Update buildOutput to respect config

- [ ] **Step 1: Read config from routing at start of buildOutput**

Add at the top of `buildOutput()`:
```typescript
const config = _routing.config ?? {};
const aliasPrefix = (config.aliasPrefix as string) ?? "";
const includeAgents = (config.includeAgents as boolean) ?? true;
const includeCategories = (config.includeCategories as boolean) ?? true;
const globalFallbackOverride = (config.globalFallbackOverride as string) ?? "";
const effectiveFallback = globalFallbackOverride || globalFallback;
```

- [ ] **Step 2: Conditionally skip agent loop when includeAgents is false**

Wrap the agent alias loop with:
```typescript
if (includeAgents) {
  for (const agent of agents as AgentWithId[]) {
    // ... existing alias generation, but use effectiveFallback instead of globalFallback
  }
}
```

- [ ] **Step 3: Conditionally skip category loop when includeCategories is false**

Wrap the category alias loop with:
```typescript
if (includeCategories) {
  // ... existing category alias generation, but use effectiveFallback instead of globalFallback
}
```

- [ ] **Step 4: Apply aliasPrefix to generated aliases**

After generating aliases in each loop, apply the prefix before adding to the aliases object. For each alias key:
```typescript
const prefixedKey = aliasPrefix ? `${aliasPrefix}${key}` : key;
aliases[prefixedKey] = value;
```

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
pnpm --filter @lite-llm/agents-manager lint
```

Expected: No lint errors

- [ ] **Step 3: Run tests (if any exist for this plugin)**

```bash
pnpm --filter @lite-llm/agents-manager test
```

Expected: All tests pass (or `passWithNoTests`)

---

## Verification Checklist

- [ ] `getConfigSchema()` returns 4 fields matching the spec
- [ ] `buildOutput()` reads config from `routing.config`
- [ ] `includeAgents: false` skips agent alias generation
- [ ] `includeCategories: false` skips category alias generation
- [ ] `aliasPrefix` is prepended to every alias key
- [ ] `globalFallbackOverride` takes precedence over `ctx.globalFallbackModel`
- [ ] TypeScript compiles without errors
