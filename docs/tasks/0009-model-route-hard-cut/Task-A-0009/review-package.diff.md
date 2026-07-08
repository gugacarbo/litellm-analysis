# Review Package: Task-A-0009

- **Plan ID:** 0009-model-route-hard-cut
- **Task ID:** Task-A-0009
- **Base:** f4345d1
- **Head:** 9cca9a2
- **Commit range:** f4345d1..9cca9a2

## Commits

9cca9a2 feat(contracts): canonicalize ModelRoute contract and adapter semantics

## Diff stat

.../Task-A-0009/report.md | 49 ++++++++++++++++++++++
.../0009-model-route-hard-cut/progress-ledger.md | 14 +++----
.../0009-model-route-hard-cut/super-plan.json | 2 +-
packages/contracts/src/analytics.ts | 22 +++++++++-
.../adapters/**tests**/model-route-adapter.test.ts | 7 ++--
.../src/adapters/model-route-adapter.ts | 8 ++--
services/llm-config-service/src/index.ts | 2 +-
services/llm-config-service/src/types/index.ts | 2 +-
.../llm-config-service/src/types/model-route.ts | 10 ++---
9 files changed, 93 insertions(+), 23 deletions(-)

## Full diff

diff --git a/docs/tasks/0009-model-route-hard-cut/Task-A-0009/report.md b/docs/tasks/0009-model-route-hard-cut/Task-A-0009/report.md
new file mode 100644
index 0000000..853286f
--- /dev/null
+++ b/docs/tasks/0009-model-route-hard-cut/Task-A-0009/report.md
@@ -0,0 +1,49 @@
+# Task-A-0009 Report: Canonicalize shared ModelRoute contract and adapter semantics +
+## What was changed and why +
+### Step 1: Tightened the canonical route type (`model-route.ts`) +
+- **`RouteParams`** (line 67): Replaced `Record<string, unknown>` with `Partial<Pick<ModelRoute, ReservedRouteParamKey>>`. This derives the type directly from `ModelRoute` fields, making it a proper typed shape instead of a generic record. All downstream consumers now get compile-time enforcement of canonical field names. +
+- **`MODEL_ROUTE_TO_SNAKE_PARAM`** → **`MODEL_ROUTE_TO_ROUTE_PARAM`** (line 119): Renamed because the constant maps `ModelRoute` fields to camelCase route param keys, not snake_case. The old name was misleading. Also tightened the value type from `string` to `ReservedRouteParamKey` for additional type safety. +
+### Step 2: Simplified adapter semantics (`model-route-adapter.ts`) +
+- Updated the import and usage of the renamed constant (`MODEL_ROUTE_TO_ROUTE_PARAM`).
+- `fromModelRoute` now uses a local `Record<string, unknown>` accumulator with a terminal `as RouteParams` cast — necessary because `Object.entries()` doesn't narrow key types, but the cast is safe since all mapped keys are valid `RouteParams` keys.
+- Legacy rejection (`LEGACY_ROUTE_PARAM_KEYS`, `assertCanonicalRouteParams`) preserved unchanged. +
+### Step 3: Replaced generic shared contract usage (`analytics.ts`) +
+- Defined a typed `ModelRoute` interface in `packages/contracts/src/analytics.ts` matching the canonical shape from `llm-config-service`. This avoids adding a dependency from the shared contracts package to a service package.
+- `ModelConfig.modelRoute` changed from `Record<string, unknown>` to `ModelRoute`.
+- `ModelDetail` left as-is (snake_case is acceptable at the persistence boundary per conventions). +
+### Test updates +
+- `model-route-adapter.test.ts`: Added `RouteParams` import. Legacy-key rejection tests now use `as RouteParams` casts since the tightened type correctly rejects unknown keys at compile time — the runtime rejection assertions remain intact. +
+### Barrel exports +
+- `types/index.ts` and `index.ts` in `llm-config-service`: Updated `MODEL_ROUTE_TO_SNAKE_PARAM` → `MODEL_ROUTE_TO_ROUTE_PARAM`. +
+## Verification results +
+```
+@lite-llm/llm-config-service:

- typecheck: PASS (tsc --noEmit)
- test: 6 files passed, 40 tests passed
-

+@lite-llm/contracts:

- typecheck: PASS (tsc --noEmit)
- test: 1 file passed, 2 tests passed
  +```
-

+## Concerns for downstream tasks +
+- **Task-B / Task-C (model-routes.ts refactor)**: The `PersistedModelConfigSpec` type in `packages/server/src/routes/model-routes.ts` and `apps/server/src/__tests__/model-routes-save.test.ts` still uses its own local type. These should be aligned with the canonical `ModelRoute` from `llm-config-service` in their respective tasks. +
+- **Web app `ModelRoute`**: `apps/web/src/shared/lib/api-client/models.ts` defines its own `ModelRoute` type (lines 14-31) that is structurally identical but lacks `metadata`. This is a separate concern for the web app's own task. +
+- **`coerceRouteParams`** in `packages/server/src/orchestration/route-params.ts` still uses `Record<string, unknown>` — this is a coercion utility that operates on arbitrary input before it reaches the adapter, so the loose type is appropriate there.
diff --git a/docs/tasks/0009-model-route-hard-cut/progress-ledger.md b/docs/tasks/0009-model-route-hard-cut/progress-ledger.md
index 7197e35..e933448 100644
--- a/docs/tasks/0009-model-route-hard-cut/progress-ledger.md
+++ b/docs/tasks/0009-model-route-hard-cut/progress-ledger.md
@@ -1,56 +1,56 @@

# Progress Ledger: model-route-hard-cut

> **Plan:** `0009-model-route-hard-cut`
> **Registry:** `docs/tasks/0009-model-route-hard-cut/super-plan.json`
> -> **Generated:** 2026-07-07T13:43:33Z
> +> **Generated:** 2026-07-07T13:55:42Z
> **Regenerated on every `super-plan.json` write via the active `render-progress-ledger.sh` helper path**

## Summary

| Status           | Count     |
| ---------------- | --------- |
| -                | pending   | 6   |
| +                | pending   | 5   |
| in_progress      | 0         |
| ready_for_review | 0         |
| -                | reviewing | 0   |
| +                | reviewing | 1   |
| needs_fix        | 0         |
| blocked          | 0         |
| completed        | 0         |
| cancelled        | 0         |
| **Total**        | **6**     |

## Agent Profiles

| Profile | Model   | Agent   |
| ------- | ------- | ------- |
| -       | general | default | default |
| -       | deep    | default | default |
| -       | quick   | default | default |
| +       | general | default | general |
| +       | deep    | default | deep    |
| +       | quick   | default | quick   |

## Tasks

| Task ID     | Title                                                                 | Profile                                                       | Batch   | Phase      | Status     | Dependencies                          |
| ----------- | --------------------------------------------------------------------- | ------------------------------------------------------------- | ------- | ---------- | ---------- | ------------------------------------- |
| -           | Task-A-0009                                                           | Canonicalize shared ModelRoute contract and adapter semantics | general | A          | foundation | ⏳ pending                            | —   |
| +           | Task-A-0009                                                           | Canonicalize shared ModelRoute contract and adapter semantics | general | A          | foundation | 🔍 reviewing                          | —   |
| Task-B-0009 | Harden the HTTP/orchestration boundary                                | general                                                       | B       | foundation | ⏳ pending | Task-A-0009                           |
| Task-C-0009 | Collapse parallel route and config handling in the server runtime     | deep                                                          | C       | core       | ⏳ pending | Task-B-0009                           |
| Task-D-0009 | Refactor the web models surface around typed route and table-row data | deep                                                          | D       | surface    | ⏳ pending | Task-A-0009, Task-C-0009              |
| Task-E-0009 | Refresh regression coverage for the hard cut                          | general                                                       | E       | surface    | ⏳ pending | Task-B-0009, Task-C-0009, Task-D-0009 |
| Task-F-0009 | Close docs alignment and final verification hooks                     | quick                                                         | F       | final      | ⏳ pending | Task-E-0009                           |

## Timeline

| Timestamp | Task | Event                     | Try |
| --------- | ---- | ------------------------- | --- |
| —         | —    | no task events logged yet | —   |

## Requirements Coverage

| Requirement                                                                                                              | Status     | Covered By               |
| ------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------ |
| REQ-1: ModelRoute is the only public model-route contract across shared packages                                         | ⏳ pending | Task-A-0009              |
| REQ-2: HTTP boundary accepts only current modelRoute payloads                                                            | ⏳ pending | Task-B-0009, Task-E-0009 |
| REQ-3: Server runtime no longer carries parallel route shapes for the same semantics                                     | ⏳ pending | Task-C-0009              |
| REQ-4: Web models surface consumes typed route and derived table-row data                                                | ⏳ pending | Task-D-0009, Task-E-0009 |
| REQ-5: Regression coverage locks the hard cut                                                                            | ⏳ pending | Task-E-0009              |
| REQ-6: Docs and conventions reflect the completed hard cut                                                               | ⏳ pending | Task-F-0009              |
| diff --git a/docs/tasks/0009-model-route-hard-cut/super-plan.json b/docs/tasks/0009-model-route-hard-cut/super-plan.json |
| index 93cd2db..9e09307 100644                                                                                            |
| --- a/docs/tasks/0009-model-route-hard-cut/super-plan.json                                                               |
| +++ b/docs/tasks/0009-model-route-hard-cut/super-plan.json                                                               |
| @@ -1,691 +1,691 @@                                                                                                      |
| {                                                                                                                        |
| "$schema": "/home/gustavo/Apps/lite-llm-analytics/.super-planning/super-plan.schema.json",                               |
| "planId": "0009-model-route-hard-cut",                                                                                   |
| "featureName": "model-route-hard-cut",                                                                                   |
| "status": "pending",                                                                                                     |
| "source": {                                                                                                              |

     "spec": "docs/specs/0009-model-route-hard-cut-spec.md",
     "plan": "docs/plans/0009-model-route-hard-cut.md"

},
"goal": "complete the model-contract hard cut so the repo accepts, emits, and renders only the canonical ModelRoute contract, with no operational compatibility for legacy model payloads or parallel route shapes",
"architectureSummary": "First consolidate the canonical route type across shared contracts and adapters; then harden the HTTP/server boundary so only the current contract enters the runtime; next collapse remaining parallel route/config shapes in the server; then simplify the web surface so model listing and editing consume typed, derived data instead of generic payloads; finally close the cut with regression tests and documentation alignment.",
"techStack": [
"TypeScript",
"Express",
"React 19",
"TanStack React Query",
"Drizzle ORM",
"Zod",
"Vitest"
],
"executionMode": "subagent-driven",
"reviewCadence": "per_batch",
"agents": {
"general": {
"model": "",
"agent": "general"
},
"deep": {
"model": "",
"agent": "deep"
},
"quick": {
"model": "",
"agent": "quick"
}
},
"branchStrategy": {
"baseBranch": "main",
"featureBranch": "0009-model-route-hard-cut"
},
"worktree": {
"enabled": true,
"path": "../0009-model-route-hard-cut-worktree"
},
"globalConstraints": [
"This is a hard cut: no backwards-compatible acceptance of litellmParams, public snake_case, or equivalent legacy model-route aliases.",
"ModelRoute remains the only public route contract; if a second type survives, it must represent information outside routing semantics and have an explicit boundary.",
"snake_case is allowed only at the PostgreSQL schema/persistence adapter boundary.",
"packages/contracts, packages/server, services/llm-config-service, and apps/web must converge on the same canonical route semantics in this cut.",
"The models table must render from a typed derived row shape, not from Record<string, unknown> or inline key probing.",
"Tests and fixtures must be updated in the same cut; stale compatibility fixtures are not acceptable except as explicit rejection coverage.",
"Preserve current product capabilities for listing, editing, creating, deleting, syncing, and health/status display of models, unless the behavior exists only for legacy compatibility."
],
"fileStructure": [
{
"path": "services/llm-config-service/src/types/model-route.ts",
"ownerTask": "Task-A-0009",
"notes": "Canonical route contract remains the single source of semantics"
},
{
"path": "services/llm-config-service/src/adapters/model-route-adapter.ts",
"ownerTask": "Task-A-0009",
"notes": "Keep only canonical parsing/mapping plus explicit legacy rejection"
},
{
"path": "packages/contracts/src/analytics.ts",
"ownerTask": "Task-A-0009",
"notes": "Replace generic Record<string, unknown> model-route contract"
},
{
"path": "packages/server/src/orchestration/registry-models-bridge.ts",
"ownerTask": "Task-B-0009",
"notes": "Enforce canonical request parsing at the HTTP boundary"
},
{
"path": "packages/server/src/orchestration/route-params.ts",
"ownerTask": "Task-B-0009",
"notes": "Remove remaining legacy route-param normalization paths"
},
{
"path": "packages/server/src/routes/model-routes.ts",
"ownerTask": "Task-C-0009",
"notes": "Collapse route/config parallelism and remove legacy payload acceptance"
},
{
"path": "services/analytics-service/src/data-source/registry-methods.ts",
"ownerTask": "Task-C-0009",
"notes": "Align analytics-facing registry mapping to canonical route type"
},
{
"path": "apps/web/src/shared/lib/api-client/models.ts",
"ownerTask": "Task-D-0009",
"notes": "Expose typed model-route surface to the web app"
},
{
"path": "apps/web/src/features/models/model-display.ts",
"ownerTask": "Task-D-0009",
"notes": "Normalize model display composition around typed route data"
},
{
"path": "apps/web/src/features/models/models-utils.ts",
"ownerTask": "Task-D-0009",
"notes": "Remove legacy key-reading helpers or replace with typed derivation"
},
{
"path": "apps/web/src/features/models/components/models-table-card.tsx",
"ownerTask": "Task-D-0009",
"notes": "Consume typed table-row/view-model instead of raw generic payload"
},
{
"path": "apps/web/src/features/models/use-models-page.ts",
"ownerTask": "Task-D-0009",
"notes": "Build typed table data and keep current page behavior intact"
},
{
"path": "apps/server/src/**tests**/",
"ownerTask": "Task-E-0009",
"notes": "Update route/request regression tests and add hard-cut rejection coverage"
},
{
"path": "apps/web/src/pages/**tests**/models-gates.test.tsx",
"ownerTask": "Task-E-0009",
"notes": "Align web-side fixtures and UI assumptions"
},
{
"path": "packages/contracts/src/**tests**/api-contracts.test.ts",
"ownerTask": "Task-E-0009",
"notes": "Ensure shared model contracts no longer permit generic route shape"
},
{
"path": "docs/context/CONVENTIONS.md",
"ownerTask": "Task-F-0009",
"notes": "Reflect the completed hard cut if any wording still implies compatibility"
},
{
"path": "docs/specs/README.md",
"ownerTask": "Task-F-0009",
"notes": "Regenerated spec index after docs updates"
},
{
"path": "docs/index.json",
"ownerTask": "Task-F-0009",
"notes": "Regenerated docs index after docs updates"
}
],
"requirementsChecklist": [
{
"id": "REQ-1",
"title": "ModelRoute is the only public model-route contract across shared packages",
"source": "SPEC-0009 Contrato - Contrato canonico unico",
"status": "pending",
"acceptanceCriteria": [
"Shared contracts no longer model current modelRoute data as Record<string, unknown>",
"Canonical route semantics are sourced from one typed contract",
"Public route fields remain camelCase-only"
],
"coveredByTasks": [
"Task-A-0009"
],
"notes": []
},
{
"id": "REQ-2",
"title": "HTTP boundary accepts only current modelRoute payloads",
"source": "SPEC-0009 Fluxo 5-7; Casos de borda 1-2",
"status": "pending",
"acceptanceCriteria": [
"API rejects litellmParams and equivalent legacy aliases with explicit 4xx errors",
"API rejects public snake_case route fields instead of normalizing them",
"Accepted requests use only the current modelRoute contract"
],
"coveredByTasks": [
"Task-B-0009",
"Task-E-0009"
],
"notes": []
},
{
"id": "REQ-3",
"title": "Server runtime no longer carries parallel route shapes for the same semantics",
"source": "SPEC-0009 Fluxo 8; Contrato - Superficies que devem convergir",
"status": "pending",
"acceptanceCriteria": [
"Model route flows in model-routes.ts operate on the canonical route contract where semantics overlap",
"Any surviving non-route config shape is explicitly isolated and named",
"Legacy compatibility branches for old route semantics are removed"
],
"coveredByTasks": [
"Task-C-0009"
],
"notes": []
},
{
"id": "REQ-4",
"title": "Web models surface consumes typed route and derived table-row data",
"source": "SPEC-0009 Fluxo 3-4; Contrato - Tabela de modelos",
"status": "pending",
"acceptanceCriteria": [
"Web API client exposes typed modelRoute data",
"Models table renders from a typed derived row shape",
"UI no longer probes legacy keys like input_cost_per_token, context_window_size, or max_tokens"
],
"coveredByTasks": [
"Task-D-0009",
"Task-E-0009"
],
"notes": []
},
{
"id": "REQ-5",
"title": "Regression coverage locks the hard cut",
"source": "SPEC-0009 Fluxo 9; Casos de borda 3-7",
"status": "pending",
"acceptanceCriteria": [
"Contracts, server, and web tests use canonical typed route fixtures",
"Server tests cover explicit rejection of removed payload forms",
"Regression coverage prevents silent reintroduction of generic or legacy route handling"
],
"coveredByTasks": [
"Task-E-0009"
],
"notes": []
},
{
"id": "REQ-6",
"title": "Docs and conventions reflect the completed hard cut",
"source": "SPEC-0009 Revisao humana; Definition of Done",
"status": "pending",
"acceptanceCriteria": [
"Conventions/docs do not imply tolerated legacy model payloads",
"Spec and docs indexes are regenerated after the change",
"Final verification inputs are ready for spec closeout"
],
"coveredByTasks": [
"Task-F-0009"
],
"notes": []
}
],
"taskDirectory": "docs/tasks/0009-model-route-hard-cut",
"rules": [],
"tasks": [
{
"id": "Task-A-0009",
"title": "Canonicalize shared ModelRoute contract and adapter semantics",
"description": "Unify route semantics at the source so downstream layers stop inventing their own partial model-route contracts.",

-      "status": "pending",

*      "status": "reviewing",
       "tryCount": 1,
       "task_profile": "general",
       "batch": "A",
       "phase": "foundation",
       "reportFile": "docs/tasks/0009-model-route-hard-cut/Task-A-0009/report.md",
       "reviewPackage": "docs/tasks/0009-model-route-hard-cut/Task-A-0009/review-package.diff.md",
       "progressLog": "docs/tasks/0009-model-route-hard-cut/Task-A-0009/progress.log",
       "logTaskScript": "docs/tasks/0009-model-route-hard-cut/Task-A-0009/log-task.sh",
       "dependencies": [],
       "acceptanceCriteria": [
         "Current model-route contracts are strongly typed across shared packages",
         "Adapter parsing/mapping supports only canonical route semantics plus explicit rejection",
         "No public current-flow contract still models modelRoute as a generic record"
       ],
       "requirements": [
         "REQ-1"
       ],
       "rules": [
         "Do not widen the route contract to preserve old payload forms",
         "Keep snake_case limited to persistence concerns",
         "Preserve explicit rejection coverage for removed legacy fields"
       ],
       "steps": [
         {
           "order": 1,
           "title": "Tighten the canonical route type",
           "description": "Audit the canonical ModelRoute definition and remove public helpers or comments that imply operational legacy compatibility instead of explicit rejection.",
           "command": "Edit services/llm-config-service/src/types/model-route.ts",
           "expectedResult": "Canonical route semantics are expressed in one typed source",
           "codeExample": null
         },
         {
           "order": 2,
           "title": "Simplify adapter semantics",
           "description": "Update the model-route adapter so create/update parsing and DB mapping operate only on the canonical contract plus explicit rejection of legacy keys.",
           "command": "Edit services/llm-config-service/src/adapters/model-route-adapter.ts",
           "expectedResult": "Adapter code handles only canonical route mapping and explicit legacy rejection",
           "codeExample": null
         },
         {
           "order": 3,
           "title": "Replace generic shared contract usage",
           "description": "Replace generic modelRoute contract types in packages/contracts with the canonical typed shape or a strongly typed alias derived from it.",
           "command": "Edit packages/contracts/src/analytics.ts and related tests",
           "expectedResult": "Shared contracts compile with typed modelRoute data",
           "codeExample": null
         }
       ],
       "filesTouched": [
         "services/llm-config-service/src/types/model-route.ts",
         "services/llm-config-service/src/adapters/model-route-adapter.ts",
         "packages/contracts/src/analytics.ts",
         "packages/contracts/src/__tests__/api-contracts.test.ts"
       ],
       "files": {
         "created": [],
         "modified": [
           "services/llm-config-service/src/types/model-route.ts",
           "services/llm-config-service/src/adapters/model-route-adapter.ts",
           "packages/contracts/src/analytics.ts",
           "packages/contracts/src/__tests__/api-contracts.test.ts"
         ],
         "deleted": []
       },
       "notes": []
  },
  {
  "id": "Task-B-0009",
  "title": "Harden the HTTP/orchestration boundary",
  "description": "Make sure legacy payloads are rejected at the server boundary instead of being normalized deeper in the stack.",
  "status": "pending",
  "tryCount": 1,
  "task_profile": "general",
  "batch": "B",
  "phase": "foundation",
  "reportFile": "docs/tasks/0009-model-route-hard-cut/Task-B-0009/report.md",
  "reviewPackage": "docs/tasks/0009-model-route-hard-cut/Task-B-0009/review-package.diff.md",
  "progressLog": "docs/tasks/0009-model-route-hard-cut/Task-B-0009/progress.log",
  "logTaskScript": "docs/tasks/0009-model-route-hard-cut/Task-B-0009/log-task.sh",
  "dependencies": [
  "Task-A-0009"
  ],
  "acceptanceCriteria": [
  "Server request parsing accepts only canonical modelRoute payloads",
  "litellmParams and public snake_case are rejected with explicit 4xx behavior",
  "Boundary-level tests cover both accepted canonical and rejected legacy requests"
  ],
  "requirements": [
  "REQ-2"
  ],
  "rules": [
  "Do not silently normalize legacy payloads",
  "Keep request-parsing errors actionable for admin/API consumers",
  "Reuse the shared route contract from Task A"
  ],
  "steps": [
  {
  "order": 1,
  "title": "Enforce canonical request parsing",
  "description": "Update the registry models bridge so request parsing accepts only modelRoute in the current shape and fails explicitly for legacy payload forms.",
  "command": "Edit packages/server/src/orchestration/registry-models-bridge.ts",
  "expectedResult": "Boundary helper parses only the supported contract",
  "codeExample": null
  },
  {
  "order": 2,
  "title": "Remove residual legacy normalization",
  "description": "Simplify route-params helpers so they keep only canonical route construction that still serves live code paths.",
  "command": "Edit packages/server/src/orchestration/route-params.ts",
  "expectedResult": "No residual LiteLLM-era route normalization remains",
  "codeExample": null
  },
  {
  "order": 3,
  "title": "Add boundary regression coverage",
  "description": "Update server tests to cover accepted canonical payloads and rejected legacy payloads at the API/orchestration edge.",
  "command": "Edit apps/server/src/**tests**/registry-integration.test.ts and model-routes-save.test.ts",
  "expectedResult": "Regression tests fail if old payload forms become accepted again",
  "codeExample": null
  }
  ],
  "filesTouched": [
  "packages/server/src/orchestration/registry-models-bridge.ts",
  "packages/server/src/orchestration/route-params.ts",
  "apps/server/src/**tests**/registry-integration.test.ts",
  "apps/server/src/**tests**/model-routes-save.test.ts"
  ],
  "files": {
  "created": [],
  "modified": [
  "packages/server/src/orchestration/registry-models-bridge.ts",
  "packages/server/src/orchestration/route-params.ts",
  "apps/server/src/**tests**/registry-integration.test.ts",
  "apps/server/src/**tests**/model-routes-save.test.ts"
  ],
  "deleted": []
  },
  "notes": []
  },
  {
  "id": "Task-C-0009",
  "title": "Collapse parallel route and config handling in the server runtime",
  "description": "Remove the remaining runtime duplication where the server carries an alternate shape for information already owned by ModelRoute.",
  "status": "pending",
  "tryCount": 1,
  "task_profile": "deep",
  "batch": "C",
  "phase": "core",
  "reportFile": "docs/tasks/0009-model-route-hard-cut/Task-C-0009/report.md",
  "reviewPackage": "docs/tasks/0009-model-route-hard-cut/Task-C-0009/review-package.diff.md",
  "progressLog": "docs/tasks/0009-model-route-hard-cut/Task-C-0009/progress.log",
  "logTaskScript": "docs/tasks/0009-model-route-hard-cut/Task-C-0009/log-task.sh",
  "dependencies": [
  "Task-B-0009"
  ],
  "acceptanceCriteria": [
  "Route-related server flows use canonical route data where semantics overlap",
  "Any surviving non-route shape is explicitly isolated and named",
  "Legacy compatibility branches for route semantics are removed from live runtime paths"
  ],
  "requirements": [
  "REQ-3"
  ],
  "rules": [
  "Do not conflate truly non-route config with ModelRoute",
  "Preserve current product behavior except legacy compatibility",
  "Prefer direct simplification over adding new wrappers"
  ],
  "steps": [
  {
  "order": 1,
  "title": "Refactor route-centric server flows",
  "description": "Update model-routes.ts so listing, create, update, and sync-related route handling use canonical route data instead of parallel route shapes where semantics overlap.",
  "command": "Edit packages/server/src/routes/model-routes.ts",
  "expectedResult": "Live server flows no longer depend on ambiguous parallel route structures",
  "codeExample": null
  },
  {
  "order": 2,
  "title": "Align analytics-facing registry mapping",
  "description": "Adjust analytics-side registry mapping so emitted/listed route data stays consistent with the canonical route contract.",
  "command": "Edit services/analytics-service/src/data-source/registry-methods.ts",
  "expectedResult": "Analytics/listing surfaces emit the same route shape as the rest of the runtime",
  "codeExample": null
  },
  {
  "order": 3,
  "title": "Refresh server runtime tests",
  "description": "Update route-focused integration tests to reflect the simplified runtime semantics after the hard cut.",
  "command": "Edit server regression tests under apps/server/src/**tests**",
  "expectedResult": "Server tests cover the simplified runtime without parallel-route assumptions",
  "codeExample": null
  }
  ],
  "filesTouched": [
  "packages/server/src/routes/model-routes.ts",
  "services/analytics-service/src/data-source/registry-methods.ts",
  "apps/server/src/**tests**/model-routes-save.test.ts",
  "apps/server/src/**tests**/model-routes-aliases.test.ts",
  "apps/server/src/**tests**/registry-integration.test.ts"
  ],
  "files": {
  "created": [],
  "modified": [
  "packages/server/src/routes/model-routes.ts",
  "services/analytics-service/src/data-source/registry-methods.ts",
  "apps/server/src/**tests**/model-routes-save.test.ts",
  "apps/server/src/**tests**/model-routes-aliases.test.ts",
  "apps/server/src/**tests**/registry-integration.test.ts"
  ],
  "deleted": []
  },
  "notes": []
  },
  {
  "id": "Task-D-0009",
  "title": "Refactor the web models surface around typed route and table-row data",
  "description": "Simplify the frontend so it consumes typed route data and a derived models table row/view-model instead of probing generic payloads.",
  "status": "pending",
  "tryCount": 1,
  "task_profile": "deep",
  "batch": "D",
  "phase": "surface",
  "reportFile": "docs/tasks/0009-model-route-hard-cut/Task-D-0009/report.md",
  "reviewPackage": "docs/tasks/0009-model-route-hard-cut/Task-D-0009/review-package.diff.md",
  "progressLog": "docs/tasks/0009-model-route-hard-cut/Task-D-0009/progress.log",
  "logTaskScript": "docs/tasks/0009-model-route-hard-cut/Task-D-0009/log-task.sh",
  "dependencies": [
  "Task-A-0009",
  "Task-C-0009"
  ],
  "acceptanceCriteria": [
  "Web API client and feature types expose typed modelRoute data",
  "Models table renders from typed derived row data rather than raw generic payloads",
  "Legacy key-probing helpers are removed or replaced with typed derivation"
  ],
  "requirements": [
  "REQ-4"
  ],
  "rules": [
  "Keep existing page behavior, grouping, and actions unless they only exist for compatibility",
  "Do not leak snake_case or generic route probing into components",
  "Prefer a dedicated table-row builder over inline component derivation"
  ],
  "steps": [
  {
  "order": 1,
  "title": "Tighten web model API types",
  "description": "Update shared web model client helpers so they expose typed modelRoute data matching the hard-cut contract.",
  "command": "Edit apps/web/src/shared/lib/api-client/models.ts",
  "expectedResult": "Web app code consumes typed route data from the API client",
  "codeExample": null
  },
  {
  "order": 2,
  "title": "Build typed display and table-row data",
  "description": "Refactor model-display, models-utils, and use-models-page so the models surface computes a typed display/table row model instead of probing generic payload keys.",
  "command": "Edit apps/web/src/features/models/model-display.ts, models-utils.ts, and use-models-page.ts",
  "expectedResult": "Derived table data is render-ready and typed",
  "codeExample": null
  },
  {
  "order": 3,
  "title": "Simplify the models table component",
  "description": "Update ModelsTableCard to render only from the typed row shape and remove inline compatibility logic.",
  "command": "Edit apps/web/src/features/models/components/models-table-card.tsx",
  "expectedResult": "Table rendering is purely presentational over typed data",
  "codeExample": null
  }
  ],
  "filesTouched": [
  "apps/web/src/shared/lib/api-client/models.ts",
  "apps/web/src/features/models/model-display.ts",
  "apps/web/src/features/models/models-utils.ts",
  "apps/web/src/features/models/use-models-page.ts",
  "apps/web/src/features/models/components/models-table-card.tsx"
  ],
  "files": {
  "created": [],
  "modified": [
  "apps/web/src/shared/lib/api-client/models.ts",
  "apps/web/src/features/models/model-display.ts",
  "apps/web/src/features/models/models-utils.ts",
  "apps/web/src/features/models/use-models-page.ts",
  "apps/web/src/features/models/components/models-table-card.tsx"
  ],
  "deleted": []
  },
  "notes": []
  },
  {
  "id": "Task-E-0009",
  "title": "Refresh regression coverage for the hard cut",
  "description": "Lock the cut with contracts, server, and web tests so the repo cannot silently reintroduce generic or legacy route handling.",
  "status": "pending",
  "tryCount": 1,
  "task_profile": "general",
  "batch": "E",
  "phase": "surface",
  "reportFile": "docs/tasks/0009-model-route-hard-cut/Task-E-0009/report.md",
  "reviewPackage": "docs/tasks/0009-model-route-hard-cut/Task-E-0009/review-package.diff.md",
  "progressLog": "docs/tasks/0009-model-route-hard-cut/Task-E-0009/progress.log",
  "logTaskScript": "docs/tasks/0009-model-route-hard-cut/Task-E-0009/log-task.sh",
  "dependencies": [
  "Task-B-0009",
  "Task-C-0009",
  "Task-D-0009"
  ],
  "acceptanceCriteria": [
  "Contracts, server, and web tests use canonical typed route fixtures",
  "Server tests explicitly reject removed payload forms",
  "Regression coverage fails if generic or legacy route handling returns"
  ],
  "requirements": [
  "REQ-2",
  "REQ-4",
  "REQ-5"
  ],
  "rules": [
  "Preserve explicit rejection tests for removed compatibility",
  "Prefer focused regression suites over unrelated repo-wide churn during task work",
  "Update fixtures rather than widening production types"
  ],
  "steps": [
  {
  "order": 1,
  "title": "Align shared contract tests",
  "description": "Update contract-level tests so current modelRoute fixtures are strongly typed and no longer generic records.",
  "command": "Edit packages/contracts/src/**tests**/api-contracts.test.ts",
  "expectedResult": "Contracts test suite reflects the hard-cut route contract",
  "codeExample": null
  },
  {
  "order": 2,
  "title": "Expand server rejection coverage",
  "description": "Ensure server regression tests explicitly cover rejected legacy payloads and accepted canonical payloads.",
  "command": "Edit apps/server/src/**tests**/registry-integration.test.ts and related route tests",
  "expectedResult": "Server suites fail if removed payload forms become accepted again",
  "codeExample": null
  },
  {
  "order": 3,
  "title": "Refresh web fixtures and table coverage",
  "description": "Update web fixtures and any table/view-model coverage so the UI assumptions match the typed route surface.",
  "command": "Edit apps/web/src/pages/**tests**/models-gates.test.tsx and related coverage",
  "expectedResult": "Web tests reflect typed route data and table derivation",
  "codeExample": null
  }
  ],
  "filesTouched": [
  "packages/contracts/src/**tests**/api-contracts.test.ts",
  "apps/server/src/**tests**/registry-integration.test.ts",
  "apps/server/src/**tests**/model-routes-save.test.ts",
  "apps/server/src/**tests**/model-routes-aliases.test.ts",
  "apps/web/src/pages/**tests**/models-gates.test.tsx"
  ],
  "files": {
  "created": [],
  "modified": [
  "packages/contracts/src/**tests**/api-contracts.test.ts",
  "apps/server/src/**tests**/registry-integration.test.ts",
  "apps/server/src/**tests**/model-routes-save.test.ts",
  "apps/server/src/**tests**/model-routes-aliases.test.ts",
  "apps/web/src/pages/**tests**/models-gates.test.tsx"
  ],
  "deleted": []
  },
  "notes": []
  },
  {
  "id": "Task-F-0009",
  "title": "Close docs alignment and final verification hooks",
  "description": "Finish the hard cut with documentation that matches the implemented state and leaves no compatibility ambiguity behind.",
  "status": "pending",
  "tryCount": 1,
  "task_profile": "quick",
  "batch": "F",
  "phase": "final",
  "reportFile": "docs/tasks/0009-model-route-hard-cut/Task-F-0009/report.md",
  "reviewPackage": "docs/tasks/0009-model-route-hard-cut/Task-F-0009/review-package.diff.md",
  "progressLog": "docs/tasks/0009-model-route-hard-cut/Task-F-0009/progress.log",
  "logTaskScript": "docs/tasks/0009-model-route-hard-cut/Task-F-0009/log-task.sh",
  "dependencies": [
  "Task-E-0009"
  ],
  "acceptanceCriteria": [
  "Documentation does not imply tolerated legacy model payloads after the hard cut",
  "Docs indexes are regenerated successfully",
  "Spec closeout inputs are prepared for final implementation verification"
  ],
  "requirements": [
  "REQ-6"
  ],
  "rules": [
  "Update docs only where implementation changed the true current state",
  "Do not mark the spec implemented until code and verification are genuinely complete",
  "Regenerated indexes must come from the canonical docs-check flow"
  ],
  "steps": [
  {
  "order": 1,
  "title": "Refresh conventions if needed",
  "description": "Update conventions wording only if implementation revealed stale language around model-route compatibility or public naming.",
  "command": "Edit docs/context/CONVENTIONS.md if required",
  "expectedResult": "Docs match the implemented hard-cut behavior",
  "codeExample": null
  },
  {
  "order": 2,
  "title": "Regenerate docs indexes",
  "description": "Run the docs index generation flow so spec and docs indexes reflect the new planning and final implementation state.",
  "command": "Run scripts/docs-check --emit-index",
  "expectedResult": "docs/specs/README.md and docs/index.json are regenerated",
  "codeExample": "scripts/docs-check --emit-index"
  },
  {
  "order": 3,
  "title": "Prepare spec closeout inputs",
  "description": "Collect the verification inputs needed to transition the spec from draft toward implemented once execution completes.",
  "command": "Update the spec verification block at closeout time",
  "expectedResult": "Spec closeout path is documented and ready",
  "codeExample": null
  }
  ],
  "filesTouched": [
  "docs/context/CONVENTIONS.md",
  "docs/specs/README.md",
  "docs/index.json",
  "docs/specs/0009-model-route-hard-cut-spec.md"
  ],
  "files": {
  "created": [],
  "modified": [
  "docs/context/CONVENTIONS.md",
  "docs/specs/README.md",
  "docs/index.json",
  "docs/specs/0009-model-route-hard-cut-spec.md"
  ],
  "deleted": []
  },
  "notes": []
  }
  ]
  }
  diff --git a/packages/contracts/src/analytics.ts b/packages/contracts/src/analytics.ts
  index 7de2435..62cf067 100644
  --- a/packages/contracts/src/analytics.ts
  +++ b/packages/contracts/src/analytics.ts
  @@ -111,9 +111,29 @@ export interface ModelDetail {
  output_cost_per_token: string;
  }

+export interface ModelRoute {

- modelName: string;
- enabled?: boolean;
- displayName?: string;
- family?: string;
- ownedBy?: string;
- apiMode?: "openai" | "anthropic";
- vision?: boolean;
- contextWindowSize?: number;
- maxOutputTokens?: number;
- inputCostPerToken?: number;
- outputCostPerToken?: number;
- upstreamModel?: string;
- upstreamBaseUrl?: string;
- providerName?: string;
- secretRef?: string;
- requestOptions?: Record<string, unknown>;
- metadata?: Record<string, unknown>;
  +}
-

export interface ModelConfig {
modelName: string;

- modelRoute: Record<string, unknown>;

* modelRoute: ModelRoute;
  }

export interface ModelStatistics {
diff --git a/services/llm-config-service/src/adapters/**tests**/model-route-adapter.test.ts b/services/llm-config-service/src/adapters/**tests**/model-route-adapter.test.ts
index 06cba53..0bec2fa 100644
--- a/services/llm-config-service/src/adapters/**tests**/model-route-adapter.test.ts
+++ b/services/llm-config-service/src/adapters/**tests**/model-route-adapter.test.ts
@@ -2,6 +2,7 @@ import { describe, expect, it } from "vitest";
import type {
ModelProxyModelRecord,
ModelRoute,

- RouteParams,
  } from "../../types/model-route.js";
  import {
  fromModelProxyRow,
  @@ -25,208 +26,208 @@ const canonicalRoutePayload = {
  describe("model-route-adapter", () => {
  describe("toModelRoute", () => {
  it("maps the canonical camelCase payload to ModelRoute", () => {
  const route = toModelRoute(canonicalRoutePayload, MODEL_ALIAS);

      expect(route).toEqual({
        modelName: MODEL_ALIAS,
        inputCostPerToken: 0.000003,
        outputCostPerToken: 0.000015,
        contextWindowSize: 128_000,
        maxOutputTokens: 4096,
        providerName: "openai-main",
      });

  });

  it("keeps nested requestOptions and metadata only in their canonical fields", () => {
  const route = toModelRoute({
  ...canonicalRoutePayload,
  requestOptions: {
  temperature: 0.2,
  rpm: 100,
  },
  metadata: {
  reasoning: "medium",
  },
  });

      expect(route.requestOptions).toEqual({
        temperature: 0.2,
        rpm: 100,
      });
      expect(route.metadata).toEqual({
        reasoning: "medium",
      });
      expect(route).not.toHaveProperty("temperature");

  });

  it("uses the fallback model name when the payload omits it", () => {
  const route = toModelRoute(
  {
  maxOutputTokens: 8192,
  },
  MODEL_ALIAS,
  );

      expect(route.modelName).toBe(MODEL_ALIAS);
      expect(route.maxOutputTokens).toBe(8192);

  });

  it("rejects legacy snake_case payload fields", () => {
  expect(() =>
  toModelRoute(
  {
  model_name: MODEL_ALIAS,
  max_tokens: 8192,

*          },

-          } as RouteParams,
           MODEL_ALIAS,
         ),
       ).toThrow(/Legacy model route fields are no longer supported/);

  });

  it("rejects deprecated provider aliases and liteLLM payload wrappers", () => {
  expect(() =>
  parseModelRouteFromApi(
  {
  modelName: MODEL_ALIAS,
  litellm_provider_name: "openai-main",

*          },

-          } as RouteParams,
           MODEL_ALIAS,
         ),
       ).toThrow(/Legacy model route fields are no longer supported/);

       expect(() =>
         parseModelRouteFromApi(
           {
             modelName: MODEL_ALIAS,
             litellm_params: {
               model: MODEL_ALIAS,
             },

*          },

-          } as RouteParams,
           MODEL_ALIAS,
         ),
       ).toThrow(/Legacy model route fields are no longer supported/);

  });
  });

  describe("fromModelRoute", () => {
  it("round-trips first-class fields to the canonical camelCase payload", () => {
  const payload = fromModelRoute({
  ...toModelRoute(canonicalRoutePayload, MODEL_ALIAS),
  ownedBy: "openai",
  upstreamBaseUrl: "https://api.openai.com/v1",
  enabled: true,
  });

       expect(payload).toMatchObject({
         modelName: MODEL_ALIAS,
         enabled: true,
         inputCostPerToken: 0.000003,
         outputCostPerToken: 0.000015,
         contextWindowSize: 128_000,
         maxOutputTokens: 4096,
         providerName: "openai-main",
         upstreamBaseUrl: "https://api.openai.com/v1",
         ownedBy: "openai",
       });
       expect(payload).not.toHaveProperty("model_name");
       expect(payload).not.toHaveProperty("custom_llm_provider");

  });

  it("preserves requestOptions without lifting them to the top level", () => {
  const payload = fromModelRoute({
  modelName: MODEL_ALIAS,
  maxOutputTokens: 4096,
  requestOptions: {
  temperature: 0.5,
  },
  });

       expect(payload.maxOutputTokens).toBe(4096);
       expect(payload.requestOptions).toEqual({ temperature: 0.5 });
       expect(payload).not.toHaveProperty("temperature");

  });
  });

  describe("toModelProxyRow / fromModelProxyRow", () => {
  it("maps ModelRoute to a write shape with null defaults", () => {
  const route: ModelRoute = {
  ...toModelRoute(canonicalRoutePayload, MODEL_ALIAS),
  displayName: "GPT Test",
  family: "openai",
  apiMode: "openai",
  vision: true,
  };
  const row = toModelProxyRow(route);

       expect(row).toEqual({
         modelName: MODEL_ALIAS,
         enabled: true,
         displayName: "GPT Test",
         family: "openai",
         ownedBy: null,
         apiMode: "openai",
         vision: true,
         contextWindowSize: 128_000,
         maxOutputTokens: 4096,
         inputCostPerToken: 0.000003,
         outputCostPerToken: 0.000015,
         upstreamModel: null,
         upstreamBaseUrl: null,
         providerName: "openai-main",
         secretRef: null,
       });

  });

  it("defaults enabled to true when absent", () => {
  const row = toModelProxyRow({ modelName: MODEL_ALIAS });

       expect(row.enabled).toBe(true);

  });

  it("round-trips registry rows to ModelRoute including metadata", () => {
  const now = new Date("2026-06-16T12:00:00.000Z");
  const record: ModelProxyModelRecord = {
  id: "row-1",
  modelName: MODEL_ALIAS,
  enabled: true,
  displayName: "GPT Test",
  family: "openai",
  ownedBy: "openai",
  apiMode: "openai",
  vision: true,
  contextWindowSize: 128_000,
  maxOutputTokens: 4096,
  inputCostPerToken: 0.000003,
  outputCostPerToken: 0.000015,
  upstreamModel: "gpt-4o",
  upstreamBaseUrl: "https://api.openai.com/v1",
  providerName: "openai-main",
  secretRef: "OPENAI_MAIN_API_KEY",
  requestOptions: { temperature: 0.2 },
  metadata: { reasoning: "medium" },
  createdAt: now,
  updatedAt: now,
  };

       const route = fromModelProxyRow(record);
       const row = toModelProxyRow(route);

       expect(route).toMatchObject({
         modelName: MODEL_ALIAS,
         displayName: "GPT Test",
         family: "openai",
         ownedBy: "openai",
         apiMode: "openai",
         vision: true,
         upstreamModel: "gpt-4o",
         secretRef: "OPENAI_MAIN_API_KEY",
         requestOptions: { temperature: 0.2 },
         metadata: { reasoning: "medium" },
       });
       expect(row.modelName).toBe(MODEL_ALIAS);
       expect(row.upstreamModel).toBe("gpt-4o");
       expect(row.secretRef).toBe("OPENAI_MAIN_API_KEY");
       expect(row.metadata).toEqual({ reasoning: "medium" });

  });
  });
  });
  diff --git a/services/llm-config-service/src/adapters/model-route-adapter.ts b/services/llm-config-service/src/adapters/model-route-adapter.ts
  index dbcb83b..8ee77a0 100644
  --- a/services/llm-config-service/src/adapters/model-route-adapter.ts
  +++ b/services/llm-config-service/src/adapters/model-route-adapter.ts
  @@ -3,9 +3,9 @@ import type {
  ModelProxyModelRecord,
  ModelRoute,
  RouteParams,
  } from "../types/model-route.js";
  import {

* MODEL_ROUTE_TO_SNAKE_PARAM,

- MODEL_ROUTE_TO_ROUTE_PARAM,
  RESERVED_ROUTE_PARAM_KEYS,
  } from "../types/model-route.js";

@@ -196,18 +196,18 @@ export function parseModelRouteFromApi(

/** Convert `ModelRoute` into the canonical API payload shape. */
export function fromModelRoute(route: ModelRoute): RouteParams {

- const result: RouteParams = {};

* const result: Record<string, unknown> = {};

  for (const [routeKey, paramKey] of Object.entries(

- MODEL_ROUTE_TO_SNAKE_PARAM,

* MODEL_ROUTE_TO_ROUTE_PARAM,
  )) {
  const value = route[routeKey as keyof ModelRoute];
  if (value !== undefined) {
  result[paramKey] = value;
  }
  }

- return result;

* return result as RouteParams;
  }

/** Map `ModelRoute` to a writable `model_proxy_models` row shape. */
diff --git a/services/llm-config-service/src/index.ts b/services/llm-config-service/src/index.ts
index ab73b9b..1e012ff 100644
--- a/services/llm-config-service/src/index.ts
+++ b/services/llm-config-service/src/index.ts
@@ -64,10 +64,10 @@ export {

export type * from "./types/index.js";
export {

- MODEL_ROUTE_TO_SNAKE_PARAM,

* MODEL_ROUTE_TO_ROUTE_PARAM,
  normalizeSyncDirection,
  normalizeSyncPresenceStatus,
  RESERVED_ROUTE_PARAM_KEYS,
  ROUTE_PARAM_TO_MODEL_ROUTE,
  SETTING_KEYS,
  } from "./types/index.js";
  diff --git a/services/llm-config-service/src/types/index.ts b/services/llm-config-service/src/types/index.ts
  index 2792877..a40774b 100644
  --- a/services/llm-config-service/src/types/index.ts
  +++ b/services/llm-config-service/src/types/index.ts
  @@ -2,12 +2,12 @@ export type {
  ModelApiMode,
  ModelProxyModelRecord,
  ModelRoute,
  ModelRouteUpdate,
  ReservedRouteParamKey,
  RouteParams,
  } from "./model-route.js";
  export {

- MODEL_ROUTE_TO_SNAKE_PARAM,

* MODEL_ROUTE_TO_ROUTE_PARAM,
  RESERVED_ROUTE_PARAM_KEYS,
  ROUTE_PARAM_TO_MODEL_ROUTE,
  } from "./model-route.js";
  diff --git a/services/llm-config-service/src/types/model-route.ts b/services/llm-config-service/src/types/model-route.ts
  index a675cd0..f4d819d 100644
  --- a/services/llm-config-service/src/types/model-route.ts
  +++ b/services/llm-config-service/src/types/model-route.ts
  @@ -39,33 +39,33 @@ export type ModelRouteUpdate = Partial<Omit<ModelRoute, "modelName">>;
  /**

- Registry row shape aligned with `ModelProxyModel`.
- Used by repositories before/after DB round-trip.
  */
  export interface ModelProxyModelRecord {
  id: string;
  modelName: string;
  enabled: boolean;
  displayName: string | null;
  family: string | null;
  ownedBy: string | null;
  apiMode: string | null;
  vision: boolean | null;
  contextWindowSize: number | null;
  maxOutputTokens: number | null;
  inputCostPerToken: number | null;
  outputCostPerToken: number | null;
  upstreamModel: string | null;
  upstreamBaseUrl: string | null;
  providerName: string | null;
  secretRef: string | null;
  requestOptions: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  }

-/** Canonical model route payload object used by API helpers. _/
-export type RouteParams = Record<string, unknown>;
+/_* Canonical model route payload — typed subset of ModelRoute fields. */
+export type RouteParams = Partial<Pick<ModelRoute, ReservedRouteParamKey>>;

/**

- Canonical route payload keys absorbed into dedicated `ModelRoute` fields.
  _/
  @@ -94,46 +94,46 @@ export type ReservedRouteParamKey = (typeof RESERVED_ROUTE_PARAM_KEYS)[number];
  /_* Canonical route params → `ModelRoute` field */
  export const ROUTE_PARAM_TO_MODEL_ROUTE: Record<
  ReservedRouteParamKey,
  keyof ModelRoute | "modelName"

> = {
> modelName: "modelName",
> enabled: "enabled",
> displayName: "displayName",
> family: "family",
> ownedBy: "ownedBy",
> apiMode: "apiMode",
> vision: "vision",
> contextWindowSize: "contextWindowSize",
> maxOutputTokens: "maxOutputTokens",
> inputCostPerToken: "inputCostPerToken",
> outputCostPerToken: "outputCostPerToken",
> upstreamModel: "upstreamModel",
> upstreamBaseUrl: "upstreamBaseUrl",
> providerName: "providerName",
> secretRef: "secretRef",
> requestOptions: "requestOptions",
> metadata: "metadata",
> };

-/** `ModelRoute` → canonical route params. */
-export const MODEL_ROUTE_TO_SNAKE_PARAM: Partial<

- Record<keyof ModelRoute, string>
  +/** `ModelRoute` field → canonical route param key. */
  +export const MODEL_ROUTE_TO_ROUTE_PARAM: Partial<

* Record<keyof ModelRoute, ReservedRouteParamKey>

> = {
> modelName: "modelName",
> enabled: "enabled",
> displayName: "displayName",
> family: "family",
> ownedBy: "ownedBy",
> apiMode: "apiMode",
> vision: "vision",
> contextWindowSize: "contextWindowSize",
> maxOutputTokens: "maxOutputTokens",
> inputCostPerToken: "inputCostPerToken",
> outputCostPerToken: "outputCostPerToken",
> upstreamModel: "upstreamModel",
> upstreamBaseUrl: "upstreamBaseUrl",
> providerName: "providerName",
> secretRef: "secretRef",
> requestOptions: "requestOptions",
> metadata: "metadata",
> };

## Verification

- pnpm --filter @lite-llm/llm-config-service test: 6 files, 40 tests PASS
- pnpm --filter @lite-llm/contracts test: 1 file, 2 tests PASS
