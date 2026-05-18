# OpenCode Plugin — Switch-Group Agent Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a switch-group config field to the opencode plugin that lets users toggle which system agents are included in the generated `opencode.json` output. Selection is stored in `routing.agents` as `{ [agentId]: agentId }` pairs.

**Architecture:** A new `switch-group` field type is added to the `ConfigField` interface. The `PluginConfigForm` renders it with `<Switch>` components. The opencode plugin's `buildOutput()` filters agents by the keys present in `routing.agents`. The `usePluginConfigPage` hook injects dynamic agent options (same mechanism as `multiselect`).

**Tech Stack:** TypeScript, React, Vitest, Biome

---

## File Map

| File | Change |
|------|--------|
| `packages/api-contracts/src/agent-catalog.ts` | Add `"switch-group"` to ConfigField.type union |
| `packages/agents-manager/src/plugins/plugin-types.ts` | Same type change |
| `apps/web/src/components/plugin-routing/plugin-config-form.tsx` | Render `switch-group` with `<Switch>` components |
| `apps/web/src/pages/plugin-config/use-plugin-config-page.ts` | Inject dynamic options for `switch-group` field |
| `packages/agents-manager/src/plugins/opencode/plugin.ts` | Add `selectedAgents` to `getConfigSchema()` + update `buildOutput()` filtering |
| `packages/agents-manager/src/plugins/opencode/__tests__/plugin.test.ts` | Update tests for 3 fields in schema + new routing filter test |

---

## Task 1: Add `switch-group` to ConfigField Type

**Files:**
- Modify: `packages/api-contracts/src/agent-catalog.ts:17`
- Modify: `packages/agents-manager/src/plugins/plugin-types.ts:9`

- [ ] **Step 1: Add `"switch-group"` to ConfigField type in api-contracts**

Edit `packages/api-contracts/src/agent-catalog.ts` line 17:
```typescript
  type: "string" | "number" | "boolean" | "select" | "password" | "multiselect" | "switch-group";
```

- [ ] **Step 2: Add `"switch-group"` to ConfigField type in agents-manager plugin-types**

Edit `packages/agents-manager/src/plugins/plugin-types.ts` line 9:
```typescript
  type: "string" | "number" | "boolean" | "select" | "password" | "multiselect" | "switch-group";
```

- [ ] **Step 3: Verify both types are in sync**

Run: `pnpm --filter @lite-llm/api-contracts typecheck && pnpm --filter @lite-llm/agents-manager typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/api-contracts/src/agent-catalog.ts packages/agents-manager/src/plugins/plugin-types.ts
git commit -m "feat(config): add switch-group to ConfigField type"
```

---

## Task 2: Render switch-group in PluginConfigForm

**Files:**
- Modify: `apps/web/src/components/plugin-routing/plugin-config-form.tsx`

- [ ] **Step 1: Add switch-group rendering branch**

In `apps/web/src/components/plugin-routing/plugin-config-form.tsx`, after the `multiselect` branch (after line 130, before `) : null}`), add:

```tsx
            ) : field.type === "switch-group" && field.options ? (
              <div className="space-y-2 rounded-md border p-3">
                {field.options.map((opt) => {
                  const selected = ((values[field.key] as string[]) ??
                    []) as string[];
                  const checked = selected.includes(opt.value);
                  return (
                    <div key={opt.value} className="flex items-center gap-2">
                      <Switch
                        id={`${field.key}-${opt.value}`}
                        checked={checked}
                        onCheckedChange={() =>
                          toggleMultiSelectItem(field.key, opt.value)
                        }
                      />
                      <Label
                        htmlFor={`${field.key}-${opt.value}`}
                        className="text-sm font-normal"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            ) : null}
```

The `toggleMultiSelectItem` helper already exists (lines 27-33) — it works for `switch-group` too since both store `string[]`.

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/plugin-routing/plugin-config-form.tsx
git commit -m "feat(web): render switch-group type with Switch components in PluginConfigForm"
```

---

## Task 3: Inject Dynamic Options for switch-group in usePluginConfigPage

**Files:**
- Modify: `apps/web/src/pages/plugin-config/use-plugin-config-page.ts`

- [ ] **Step 1: Extend resolvedSchema useMemo to handle switch-group**

In `apps/web/src/pages/plugin-config/use-plugin-config-page.ts`, update the `resolvedSchema` useMemo (lines 79-97) to also handle `switch-group`:

Change:
```typescript
    return safeData.schema.map((field) => {
      if (field.type !== "multiselect") return field;
```

To:
```typescript
    return safeData.schema.map((field) => {
      if (field.type !== "multiselect" && field.type !== "switch-group")
        return field;
      if (field.key === "selectedAgents") {
        return {
          ...field,
          options: systemAgents.map((a) => ({
            value: a.key,
            label: a.displayName,
          })),
        };
      }
```

And update the condition inside the multiselect block to not duplicate the `selectedAgents` injection:

The existing code at lines 83-91 handles `selectedAgents` for `multiselect`. Since we now also need it for `switch-group`, we need to remove the `field.type !== "multiselect"` guard so the `selectedAgents` block applies to both. The updated map should be:

```typescript
    return safeData.schema.map((field) => {
      if (field.type !== "multiselect" && field.type !== "switch-group")
        return field;
      if (field.key === "selectedAgents") {
        return {
          ...field,
          options: systemAgents.map((a) => ({
            value: a.key,
            label: a.displayName,
          })),
        };
      }
      if (field.key === "selectedCategories") {
        return { ...field, options: categoryOptions };
      }
      return field;
    });
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter @lite-llm/web typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/plugin-config/use-plugin-config-page.ts
git commit -m "feat(web): inject dynamic options for switch-group schema fields"
```

---

## Task 4: Add selectedAgents to OpenCode Plugin Schema

**Files:**
- Modify: `packages/agents-manager/src/plugins/opencode/plugin.ts`

- [ ] **Step 1: Add selectedAgents field to getConfigSchema()**

In `packages/agents-manager/src/plugins/opencode/plugin.ts`, update `getConfigSchema()` (lines 75-96) to return 3 fields:

```typescript
  getConfigSchema(): ConfigField[] {
    return [
      {
        key: "defaultModel",
        type: "string",
        label: "Default Model",
        required: false,
        default: "",
        placeholder: "e.g. gpt-4",
        description: "Model to use when a system agent has no model configured",
      },
      {
        key: "defaultTemperature",
        type: "number",
        label: "Default Temperature",
        required: false,
        default: 0.2,
        description:
          "Default sampling temperature for agents without one configured",
      },
      {
        key: "selectedAgents",
        type: "switch-group",
        label: "System Agents",
        description:
          "Select which system agents to include in the generated config",
        options: [],
      },
    ];
  }
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter @lite-llm/agents-manager typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add packages/agents-manager/src/plugins/opencode/plugin.ts
git commit -m "feat(opencode): add selectedAgents switch-group field to config schema"
```

---

## Task 5: Update buildOutput() — Filter Agents by routing.agents Keys

**Files:**
- Modify: `packages/agents-manager/src/plugins/opencode/plugin.ts`
- Modify: `packages/agents-manager/src/plugins/opencode/__tests__/plugin.test.ts`

- [ ] **Step 1: Understand current buildOutput agent filtering logic**

Current logic (lines 141-166):
```typescript
const enabledAgents = routing.routing?.agents ?? {};
// ...
if (Object.keys(enabledAgents).length > 0) {
  output.agents = {};
  for (const agent of agents) {
    const agentId = agent.displayName;
    if (!(agentId in enabledAgents)) continue;
    // ...build output entry
  }
}
```

The current code ALREADY filters agents by checking if `agent.displayName` is a key in `routing.agents`. The routing format `{ "loom": "loom" }` already works with this logic — it checks if `"loom"` is in the object.

**However**, the current default routing has internal role keys like `"coder": "loom"`, not `"loom": "loom"`. The switch-group changes the stored routing to use `{ "loom": "loom" }` format.

The existing filtering logic at line 151 (`if (!(agentId in enabledAgents)) continue;`) works correctly for both formats — it checks if the agent's `displayName` is a KEY in the routing object. So `{"loom": "loom"}` means "include loom agent" because `"loom" in {"loom": "loom"}` is true.

**No code change needed in buildOutput() filtering logic** — it already handles the new routing format correctly.

- [ ] **Step 2: Update tests for getConfigSchema — now returns 3 fields**

Edit `packages/agents-manager/src/plugins/opencode/__tests__/plugin.test.ts` line 44:
```typescript
expect(schema).toHaveLength(3);
```

And update the field count check (line 53):
```typescript
expect(schema[2].key).toBe("selectedAgents");
expect(schema[2].type).toBe("switch-group");
expect(schema[2].label).toBe("System Agents");
```

- [ ] **Step 3: Add new test — selectedAgents filter behavior**

Add a new test in the `buildOutput` describe block:

```typescript
    it("só inclui agentes whose displayName is a key in routing.agents", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        {
          displayName: "Loom",
          icon: "🧵",
          description: "Coordinator",
          model: "gpt-4",
          fallbackModels: [],
          limits: { context: 100000, output: 16000 },
          config: {},
        },
        {
          displayName: "Tapestry",
          icon: "🧶",
          description: "Architect",
          model: "claude-3",
          fallbackModels: [],
          limits: { context: 100000, output: 16000 },
          config: {},
        },
        {
          displayName: "Thread",
          icon: "🧵",
          description: "Writer",
          model: "gpt-3.5",
          fallbackModels: [],
          limits: { context: 100000, output: 16000 },
          config: {},
        },
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { Loom: "Loom", Thread: "Thread" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const agentsOut = output.agents as Record<string, unknown>;
      expect(Object.keys(agentsOut)).toEqual(["Loom", "Thread"]);
      expect(agentsOut).toHaveProperty("Loom");
      expect(agentsOut).toHaveProperty("Thread");
      expect(agentsOut).not.toHaveProperty("Tapestry");
    });

    it("routing.agents vazio inclui todos os agentes (retrocompatível)", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ displayName: "Loom" }),
        makeSystemAgent({ displayName: "Tapestry" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: {}, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const agentsOut = output.agents as Record<string, unknown>;
      expect(Object.keys(agentsOut)).toHaveLength(2);
      expect(agentsOut).toHaveProperty("Loom");
      expect(agentsOut).toHaveProperty("Tapestry");
    });
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @lite-llm/agents-manager test -- --run packages/agents-manager/src/plugins/opencode/__tests__/plugin.test.ts`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/agents-manager/src/plugins/opencode/__tests__/plugin.test.ts
git commit -m "test(opencode): add routing.agents filter tests and update schema assertion to 3 fields"
```

---

## Verification

After all tasks:

1. Run full typecheck:
   ```bash
   pnpm typecheck
   ```
   Expected: No errors

2. Run agents-manager tests:
   ```bash
   pnpm --filter @lite-llm/agents-manager test -- --run
   ```
   Expected: All pass

3. Run web tests:
   ```bash
   pnpm --filter @lite-llm/web test -- --run
   ```
   Expected: All pass

4. Run lint:
   ```bash
   pnpm lint
   ```
   Expected: No errors
