---
status: accepted
# allowed values: draft | accepted | implemented | deprecated
# do not skip states; only move to implemented after Phase 7 closes.
date: 2026-07-06
builds-on:
  - SPEC-0001
# List ADRs/decisions this spec relies on. The spec CONSUMES decisions;
# it does not redefine them here.
implemented-by: []
# Filled in at close: real paths (code, migrations, functions) that deliver this spec.
---

# The model configuration settings tab is reorganized into General, Routing, and Advanced tabs with extracted sub-hooks

> Shared conventions: This spec follows the project conventions in
> `apps/web/AGENTS.md` — feature isolation (features import from `shared/`,
> never the reverse), page-level hooks colocated with pages, complex state
> split into `use-*-state.ts` / `use-*-actions.ts` / `use-*-derived.ts`, and
> shadcn/ui primitives from `@/shared/components/ui`. It builds on the manual
> routing aliases feature defined in SPEC-0001.

## Objective

Refactor the model detail **Settings** tab (`/models/:modelName/settings`) so
operators can configure a model through three clearly separated concerns —
General metadata, Routing aliases, and Advanced database parameters — instead
of a single monolithic form. The refactor also splits the 603-line
`use-model-config-page.ts` hook into smaller, testable sub-hooks and removes
alias-loading state from the form data shape.

No backend, API, schema, or routing-structure changes are part of this spec.

## Flow

1. An operator opens a model detail page and selects the **Settings** tab.
2. The Settings tab renders a shadcn `Tabs` shell with three tabs:
   **General**, **Routing**, and **Advanced**.
3. The **General** tab opens by default and shows the always-visible essential
   fields: Model Name (immutable), Display Name, Family, Owned By, API Mode,
   Vision toggle, and Enabled toggle. A collapsible **Reasoning / Thinking**
   sub-section appears below, collapsed by default; expanding it exposes
   Reasoning Effort, Reasoning API Mode, Enable Thinking, and Include
   Reasoning in Request.
4. The **Routing** tab shows the existing `ModelAliasesEditor` for manual
   routing aliases (per SPEC-0001). The editor reads aliases from a dedicated
   aliases query instead of from form data.
5. The **Advanced** tab shows API Base URL, Provider, Input Cost, Output Cost,
   and Extra Parameters (key-value pairs). This tab is hidden by default in
   the sense that the operator only visits it intentionally; it is always
   reachable via the tab bar.
6. A single sticky footer below the tab bar shows the dirty indicator and the
   Back / Save buttons. The dirty indicator is `true` when **either** the form
   hook (`useModelConfigForm`) **or** the aliases hook (`useModelAliases`)
   reports changes. Save is disabled while aliases are loading, while saving,
   or while neither hook is dirty.
7. When the operator clicks **Save**, the existing save behavior is preserved:
   update model route, update model config, then update aliases — with the
   same partial-failure handling and toast messages as today.
8. After a successful save, all three tabs reflect the persisted state and the
   dirty indicator clears.

## Contract

### UI surface

| Element                          | Component                                | Visibility                                           |
| -------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| Settings tab shell               | `ModelConfigForm` (rewritten)            | Always visible inside the Settings tab               |
| Tab bar                          | shadcn `Tabs` with `TabsList` + `TabsTrigger` | Always visible                                  |
| General tab                      | `ModelGeneralTab` (new)                  | Default open                                         |
| Reasoning sub-section            | `ReasoningSection` (extracted, collapsible) | Collapsed by default inside General               |
| Routing tab                      | `ModelRoutingTab` (new)                  | Reachable via tab bar                                |
| Aliases editor                   | `ModelAliasesEditor` (existing)          | Inside Routing tab                                   |
| Advanced tab                     | `ModelAdvancedTab` (new)                 | Reachable via tab bar                                |
| Footer (dirty + Save/Back)       | `ModelConfigFormFooter` (extracted)      | Sticky below tab content                             |

### Hook decomposition

| Hook                       | Responsibility                                                                                     | File                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `useModelConfigForm`       | Form field state, `modelToFormData`, `buildConfigFromFormData`, dirty tracking, validation helpers | `use-model-config-form.ts`                        |
| `useModelAliases`          | Aliases query + mutation state; exposes `aliases`, `loading`, `error`, `isDirty`, `save`           | `use-model-aliases.ts`                            |
| `useModelConfigSave`       | Save orchestration: route + config + aliases mutations with partial-failure handling and toasts    | `use-model-config-save.ts`                        |
| `useModelConfigPage`       | Thin composer: wires the three hooks above, exposes the shape consumed by `ModelConfigForm`        | `use-model-config-page.ts` (rewritten, slim)      |

### Form data shape

`ModelConfigFormData` is reduced to editable field values only. The
alias-loading flags (`aliasesLoaded`, `aliasesLoading`, `aliasesLoadError`)
are removed from the type and live exclusively inside `useModelAliases`.

```ts
interface ModelConfigFormData {
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

### Save contract (unchanged from current behavior)

- `updateModel(modelName, routeUpdate, undefined, config)` is called first.
- If aliases loaded successfully, `updateModelAliases(modelName, aliases)` is
  called next.
- On route-save failure: toast error, stop.
- On alias-save failure: invalidate queries, toast error noting aliases were
  not saved, reload latest aliases.
- On full success: invalidate `models-with-config` and `model-aliases`,
  toast success, clear dirty state for both form and aliases.

### Props contract

`ModelConfigForm` receives a single `controller` object from
`useModelConfigPage` instead of 9+ individual callbacks. Each tab component
receives only the slice of state it needs.

## Edge cases

| #   | WHEN ⟨trigger⟩                                                                                         | the system MUST ⟨response⟩                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 1   | the operator switches tabs while there are unsaved changes                                             | preserve the unsaved values across tab switches and keep the dirty indicator visible in the footer                  |
| 2   | the aliases query is still loading when the operator opens the Routing tab                             | show the existing `ModelAliasesEditor` loading state and disable Save in the footer                                 |
| 3   | the aliases query fails                                                                                | show the error inline in the Routing tab, keep Save enabled for non-alias fields, and toast the error once per model |
| 4   | the operator edits aliases and then switches to another tab                                            | keep the edited aliases in memory and mark the aliases hook as dirty so the footer dirty indicator reflects it      |
| 5   | the operator clicks Save while aliases are loading                                                     | disable Save (already today) and show the existing "Saving..." label                                                |
| 6   | the operator clicks Save while only aliases changed (no general/advanced field changes)               | enable Save (combined dirty is true), call `updateModel` with the current route state (no-op diff), then `updateModelAliases`, matching today |
| 7   | the model context provides a new model (route change, modelName change)                                | reset both the form hook and the aliases hook to the new model's state                                              |
| 8   | the Reasoning sub-section is collapsed and the operator had previously set reasoning fields           | keep the values in form state; collapsing does not clear values                                                     |
| 9   | an `extraParams` entry has an empty key                                                               | skip it on save (matching current behavior) and do not render it as a saved param on reload                          |
| 10  | the operator edits a field, switches model (context change), then comes back                           | discard the previous model's unsaved edits and load the new model's persisted state                                 |

## Questões em aberto

nenhuma

## Definition of Done

```bash
pnpm --filter @lite-llm/web typecheck        # exit 0
pnpm --filter @lite-llm/web test             # all green, including any new tests
pnpm --filter @lite-llm/web lint             # exit 0
```

Manual smoke check (operator-facing):

1. Open `/models/{name}/settings` — General tab opens, Reasoning collapsed.
2. Edit Display Name, switch to Routing, add an alias, switch to Advanced,
   edit API Base — footer shows unsaved changes across all tabs.
3. Click Save — all three concerns persist; success toast; dirty clears.
4. Reload — all edited values are present in their respective tabs.

## Human review

- Visual layout of the three tabs (spacing, alignment, sticky footer) on a
  representative model.
- That the Reasoning collapsible defaults to collapsed and does not lose
  values when toggled.
- That the partial-failure toasts still read the same as before the refactor.
- That no hard-coded Portuguese (or other non-English) hint text remains in
  the rewritten components.

## Verification

```text
(fill in at close)
```

<!-- Close checklist (single commit):
     [ ] DoD green, evidence above
     [ ] status: implemented + implemented-by with real paths
     [ ] new gotchas → project guidance if needed
     [ ] new current state → relevant docs/context if needed
     [ ] generated docs/indexes refreshed if the repo requires it -->