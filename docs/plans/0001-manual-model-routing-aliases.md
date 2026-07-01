# Manual Model Routing Aliases Implementation Plan

> **For agentic workers:** Use subagent-driven development to implement this plan task-by-task.
> The executable source of truth is `docs/tasks/0001-manual-model-routing-aliases/tasks.json`.

**Goal:** Let operators create manual routing aliases from a model detail page
and manage them from a global models view, using `router_settings` as the only
source of truth.

**Architecture:** Keep manual aliases in
`router_settings.value.model_group_alias`, but add explicit ownership metadata
under `__lite_llm_analytics.manualModelAliasKeys` so dashboard-managed aliases
can be updated without clobbering generated plugin aliases. Expose dedicated
model-alias endpoints in `model-routes.ts`, then consume them from two web
surfaces: the model settings tab and a global aliases page under `/models`.

**Tech Stack:** Express routes in `packages/server`, registry/model services,
React 19 + React Router, TanStack Query, shared web API client helpers, Vitest.

## Global Constraints

- Source of truth remains `model_proxy_settings.key = "router_settings"` and
  `router_settings.value.model_group_alias`.
- Manual aliases are tracked explicitly in
  `router_settings.value.__lite_llm_analytics.manualModelAliasKeys` as an array
  of alias keys owned by the dashboard.
- Existing plugin-managed alias tracking in
  `__lite_llm_analytics.managedModelGroupAliasKeys` remains intact and
  independent.
- The dashboard MUST update only manual alias keys that it owns, preserving
  plugin-generated aliases and unrelated router settings fields.
- Alias values MUST reference an existing model in the registry-backed model
  catalog.
- Aliases are routing-only and do not create entries in
  `model_proxy_models`, `models.jsonc`, benchmark aliases, or analytics
  rollups.
- Alias key MUST be unique across all manual and generated aliases.
- Alias key MUST NOT equal the name of any real model.
- Alias key MUST NOT target another alias; targets must resolve to canonical
  model names only.
- The global aliases view is placed in the models area, not in plugins.

## File Structure

| File/Directory | Owner Task | Notes |
| -------------- | ---------- | ----- |
| `packages/server/src/orchestration/manual-model-aliases.ts` | `Task-A-0001` | New helper that reads, validates, writes, retargets, and guards dashboard-owned aliases in `router_settings`. |
| `packages/server/src/orchestration/router-settings.ts` | `Task-A-0001` | Reuse existing settings write path; keep plugin-managed aliases intact. |
| `packages/server/src/orchestration/index.ts` | `Task-A-0001` | Export manual alias helpers for route consumption. |
| `packages/server/src/routes/model-routes.ts` | `Task-B-0001` | Add alias list/read/write/delete endpoints plus rename/delete guards. |
| `apps/server/src/__tests__/model-routes-aliases.test.ts` | `Task-B-0001` | New integration coverage for alias CRUD, collisions, rename retarget, and delete guard. |
| `apps/web/src/shared/lib/api-client/model-aliases.ts` | `Task-B-0001` | Dedicated client wrappers and response types for manual alias endpoints. |
| `apps/web/src/features/models/components/model-aliases-editor.tsx` | `Task-C-0001` | Reusable editor for list/add/remove within the model settings flow. |
| `apps/web/src/features/models/components/model-config-form.tsx` | `Task-C-0001` | Mount manual alias editor and routing-only copy. |
| `apps/web/src/features/models/use-model-config-page.ts` | `Task-C-0001` | Load model aliases, stage edits, save via alias endpoint, and invalidate queries. |
| `apps/web/src/features/models/models-aliases-page.tsx` | `Task-C-0002` | New global aliases table with search, target filter, and remove action. |
| `apps/web/src/App.tsx` | `Task-C-0002` | Register `/models/aliases` route. |
| `apps/web/src/shared/components/layout/sidebar.tsx` | `Task-C-0002` | Add navigation entry under models. |

## Task Registry

- **Registry:** `docs/tasks/0001-manual-model-routing-aliases/tasks.json`
- **Progress log:** `docs/tasks/0001-manual-model-routing-aliases/progress.log`
- **Progress ledger:** `docs/tasks/0001-manual-model-routing-aliases/progress-ledger.md`

---
