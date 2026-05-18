# OpenCode Plugin — Switch-Group Agent Selector

**Date:** 2026-05-18
**Status:** Approved

---

## 1. Overview

Add a switch-group UI to the OpenCode plugin configuration page that lets users toggle which system agents are included in the generated `opencode.json` output. The selection is persisted in `routing.agents` as `{ [agentId]: agentId }` pairs, and the output format changes to use system agent IDs as keys instead of internal role names.

---

## 2. ConfigField Type Extension

Add `"switch-group"` to the `ConfigField` union type.

**File:** `packages/api-contracts/src/agent-catalog.ts` and `packages/agents-manager/src/plugins/plugin-types.ts`

```typescript
export interface ConfigField {
  key: string;
  type: "string" | "number" | "boolean" | "select" | "password" | "multiselect" | "switch-group";
  // ...existing fields
}
```

`switch-group` uses the same `options` field as `multiselect` and `select`. The stored value is `string[]` (array of selected agent IDs).

---

## 3. PluginConfigForm — switch-group Rendering

**File:** `apps/web/src/components/plugin-routing/plugin-config-form.tsx`

Render `switch-group` as a bordered container with one `<Switch>` + `<Label>` per option, using the same visual style as the `multiselect` checkbox group.

```tsx
{field.type === "switch-group" && field.options ? (
  <div className="space-y-2 rounded-md border p-3">
    {field.options.map((opt) => {
      const selected = ((values[field.key] as string[]) ?? []) as string[];
      const checked = selected.includes(opt.value);
      return (
        <div key={opt.value} className="flex items-center gap-2">
          <Switch
            checked={checked}
            onCheckedChange={() => toggleMultiSelectItem(field.key, opt.value)}
          />
          <Label className="text-sm font-normal">{opt.label}</Label>
        </div>
      );
    })}
  </div>
) : null}
```

Uses the existing `toggleMultiSelectItem` helper — same toggle logic as `multiselect`.

---

## 4. Dynamic Options Injection

**File:** `apps/web/src/pages/plugin-config/use-plugin-config-page.ts`

Extend the `useMemo` that resolves dynamic options to also handle `switch-group`:

```typescript
if (field.type === "switch-group" && field.key === "selectedAgents") {
  return {
    ...field,
    options: systemAgents.map((a) => ({
      value: a.key,
      label: a.displayName,
    })),
  };
}
```

`systemAgents` comes from the existing `getAgentCatalog()` query (same source used for `multiselect`).

---

## 5. OpenCode Plugin — getConfigSchema()

**File:** `packages/agents-manager/src/plugins/opencode/plugin.ts`

Add `selectedAgents` field to the schema:

```typescript
{
  key: "selectedAgents",
  type: "switch-group",
  label: "System Agents",
  description: "Select which system agents to include in the generated config",
  options: [],  // injected by the UI hook
}
```

---

## 6. Routing Storage Format

**File:** `@agents/plugins.json`

Selection is stored in `opencode.routing.agents` as `{ [agentId]: agentId }`:

```json
"opencode": {
  "enabled": true,
  "outputFile": "",
  "config": {
    "defaultModel": "",
    "defaultTemperature": 0.2
  },
  "routing": {
    "agents": {
      "loom": "loom",
      "tapestry": "tapestry",
      "thread": "thread",
      "reviewer": "reviewer"
    },
    "categories": {}
  }
}
```

- Switch ON → adds `"agentId": "agentId"` entry
- Switch OFF → removes the entry
- Empty/null → include all agents (retrocompatible default)

---

## 7. buildOutput() Changes

**File:** `packages/agents-manager/src/plugins/opencode/plugin.ts`

Update `buildOutput()` to:

1. Read `routing.routing.agents` — object with keys = enabled agent IDs
2. Filter system agents: only include agents whose `key` is a key in the routing object
3. Use system agent ID as the output key (not internal role name)

```typescript
const enabledAgents = routing.routing?.agents ?? {};
const allAgents = ctx.allAgents;  // or equivalent

const filteredAgents = allAgents.filter((agent) => {
  if (Object.keys(enabledAgents).length === 0) return true;  // include all if empty
  return agent.key in enabledAgents;
});

// Output keys become system agent IDs
for (const agent of filteredAgents) {
  output.agent[agent.key] = buildAgentEntry(agent, routing);
}
```

If `routing.agents` is empty or undefined → include all agents (retrocompatible).

---

## 8. Output Format Change

**Before:**
```json
"agent": {
  "coder": { "model": "litellm/MiniMax-M2.7-highspeed", "fallback_models": [], "temperature": 0.2 },
  "planner": { ... },
  "architect": { ... },
  "writer": { ... },
  "reviewer": { ... }
}
```

**After:**
```json
"agent": {
  "loom": { "model": "litellm/MiniMax-M2.7-highspeed", "fallback_models": [], "temperature": 0.2 },
  "tapestry": { ... },
  "thread": { ... },
  "reviewer": { ... }
}
```

Only the selected system agents appear in the output. Unselected agents are omitted entirely.

---

## 9. Files to Modify

| File | Change |
|------|--------|
| `packages/api-contracts/src/agent-catalog.ts` | Add `"switch-group"` to ConfigField type |
| `packages/agents-manager/src/plugins/plugin-types.ts` | Same type change |
| `apps/web/src/components/plugin-routing/plugin-config-form.tsx` | Render switch-group with Switch components |
| `apps/web/src/pages/plugin-config/use-plugin-config-page.ts` | Inject dynamic options for switch-group |
| `packages/agents-manager/src/plugins/opencode/plugin.ts` | Add `selectedAgents` to schema + update `buildOutput()` |

---

## 10. Retrocompatibility

- If `routing.agents` is empty or absent → include all system agents (existing behavior preserved)
- If `selectedAgents` field is absent from schema → no switch-group rendered
- Existing opencode.json files with internal-role keys remain valid until regenerated
