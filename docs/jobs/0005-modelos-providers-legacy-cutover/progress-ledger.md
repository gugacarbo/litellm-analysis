> **Process:** `super-planning` — this ledger is generated from `super-plan.json` by the active super-planning helper.
> Follow `super-planning/SKILL.md` and the active phase instructions when interpreting or updating this work.

# Progress Ledger: modelos-providers-legacy-cutover

> **Plan:** `0005-modelos-providers-legacy-cutover`
> **Registry:** `docs/jobs/0005-modelos-providers-legacy-cutover/super-plan.json`
> **Generated:** 2026-07-15T00:29:04Z
> **Regenerated on every `super-plan.json` write via the active `render-progress-ledger.sh` helper path**

## Summary

| Status | Count |
|--------|-------|
| pending | 0 |
| in_progress | 0 |
| ready_for_review | 0 |
| reviewing | 0 |
| needs_fix | 0 |
| blocked | 0 |
| completed | 6 |
| cancelled | 0 |
| **Total** | **6** |

## Agent Profiles

| Profile | Model | Agent | Effort |
|---------|-------|--------|--------|
| general | default | default | default |
| deep | default | default | default |
| quick | default | default | default |

## Tasks

| Task ID | Title | Profile | Batch | Layer | Status | Dependencies |
|---------|-------|---------|-------|-------|--------|-------------|
| Task-A-1 | Remove the legacy provider contract from llm-config-service | deep | A | foundation | [DONE] completed | — |
| Task-B-1 | Migrate gateway provider resolution to encrypted envelopes | deep | B | core | [DONE] completed | Task-A-1 |
| Task-B-2 | Remove legacy server and analytics provider writers | deep | B | core | [DONE] completed | Task-A-1 |
| Task-C-1 | Deprecate apps/web as a read-only provider and model surface | general | C | surface | [DONE] completed | Task-B-2 |
| Task-D-1 | Remove unused packages and verify the legacy cutover | general | D | final | [DONE] completed | Task-B-1, Task-B-2, Task-C-1 |
| Task-F-1 | Remove final-audit legacy writers and default fallbacks | general | F | final | [DONE] completed | Task-D-1 |

## Timeline

| Timestamp | Task | Event | Try | Message |
|-----------|------|-------|-----|---------|
| 2026-07-14T23:07:51Z | Task-A-1 | started | None | Writing RED tests for strict encrypted runtime credential resolution |
| 2026-07-14T23:10:00Z | Task-A-1 | completed | 1 | Orchestrator: batch review clean; de03ad162c83b70e208ca80a713277c8da256be9..working-tree |
| 2026-07-14T23:10:33Z | Task-A-1 | ready_for_review | None | Task-A-1 ready: legacy provider stack deleted; strict credentialEnvelope resolver tested RED to GREEN; report.md contains pre-existing package test/typecheck blockers. |
| 2026-07-14T23:13:37Z | Task-B-2 | started | None | Task-B-2 implementation started; inspecting retained read boundaries and legacy provider consumers. |
| 2026-07-14T23:15:07Z | Task-B-1 | info | 1 | RED: focused upstream-provider tests failed 5 valid encrypted-envelope cases because resolver still used legacy credential lookup. |
| 2026-07-14T23:15:07Z | Task-B-1 | started | 1 | Started Task-B-1; reviewed testing anti-pattern guidance and migrated tests from legacy provider credentials to encrypted envelopes. |
| 2026-07-14T23:17:07Z | Task-B-1 | info | 1 | GREEN: upstream-provider focused Vitest passes 15/15; resolver scan has no secretRef or apiKey matches; git diff check passes. |
| 2026-07-14T23:17:07Z | Task-B-1 | info | 1 | Concern: gateway typecheck is blocked by concurrent cross-package legacy cleanup (models-repository ProvidersRepository import, llm-config-service model repository errors, ledger-hooks removed export); no upstream-provider type errors remain. |
| 2026-07-14T23:17:07Z | Task-B-1 | ready_for_review | 1 | Task-B-1 implementation and report are ready for batch review. |
| 2026-07-14T23:18:48Z | Task-B-2 | ready_for_review | None | Task-B-2 ready for batch review. Focused server and analytics tests are green; package typechecks remain blocked by pre-existing/in-flight Task-A contract migration errors recorded in report. |
| 2026-07-14T23:19:37Z | Task-B-2 | ready_for_review | None | Task-B-2 final state: legacy server provider writers removed, only GET /providers/default retained, analytics reads credentialEnvelope state without secretRef; report includes RED/GREEN and typecheck blockers. |
| 2026-07-14T23:21:08Z | Task-B-2 | ready_for_review | None | Task-B-2 finalized after removing remaining legacy provider integration coverage; focused GREEN evidence and blockers are in report.md. |
| 2026-07-14T23:22:00Z | Task-B-1 | completed | 1 | Orchestrator: Batch B review clean; de03ad162c83b70e208ca80a713277c8da256be9..working-tree. |
| 2026-07-14T23:22:00Z | Task-B-2 | completed | 1 | Orchestrator: Batch B review clean; de03ad162c83b70e208ca80a713277c8da256be9..working-tree. |
| 2026-07-14T23:29:00Z | Task-C-1 | ready_for_review | None | Implemented read-only apps/web provider and model views; focused tests pass; web typecheck passes. |
| 2026-07-14T23:30:52Z | Task-C-1 | ready_for_review | None | Task-C-1 complete: deprecated web model/provider routes are read-only with apps/ui handoff; focused tests, typecheck, and build passed. |
| 2026-07-14T23:30:56Z | Task-C-1 | ready_for_review | None | Task-C-1 complete: deprecated web model/provider routes are read-only with apps/ui handoff; focused tests, typecheck, and build passed. |
| 2026-07-14T23:43:27Z | Task-C-1 | ready_for_review | None | P1 follow-up complete: health and benchmarks routes are read-only with apps/ui handoffs; legacy model writer modules and API methods removed; 5 focused tests, web typecheck, and build passed. |
| 2026-07-14T23:45:46Z | Task-C-1 | ready_for_review | None | P1 fixes verified: health and benchmark route writers removed with apps/ui handoffs; legacy model writer modules/API methods and model-stat log deletion removed; focused 6 tests, web typecheck, and build passed. |
| 2026-07-14T23:49:11Z | Task-C-1 | info | None | Re-review: original three P1 findings fixed and 5 focused tests pass, but active /benchmarks/openrouter still exposes Sync and Sync now via triggerOpenRouterBenchmarkSync; Batch C remains changes requested. Health and AA sync writers are residual/unexposed; agents remain outside Task-C-1 scope but violate a whole-app read-only interpretation. |
| 2026-07-14T23:56:18Z | Task-C-1 | info | None | Final whole-app read-only review: no useMutation or POST/PUT/PATCH/DELETE client operation remains in apps/web; agents, health, AA benchmarks, and OpenRouter writers are removed; 6 focused tests and apps/web typecheck pass. Batch remains changes requested because /benchmarks/openrouter now redirects to AA and no longer preserves the distinct OpenRouter benchmark read. |
| 2026-07-14T23:58:00Z | Task-C-1 | completed | None | Orchestrator accepted final batch-C review: apps/web is globally read-only; OpenRouter benchmark reads are preserved without writers; focused tests, typecheck, build, and writer scans passed. |
| 2026-07-15T00:06:22Z | Task-D-1 | ready_for_review | 1 | Task-D-1 ready for review: providerId-null fallout removed; five focused typechecks and 37 focused tests pass; legacy scan and diff check are clean. pnpm verify -c retains documented unrelated unused-export baseline. |
| 2026-07-15T00:12:54Z | Task-D-1 | ready_for_review | 1 | Reviewer fix complete: default-provider source is exclusively model_proxy_providers.is_default; settings and local-proxy fallback contracts removed. Five focused typechecks and 13 focused tests pass; default_provider scan and diff check are clean. |
| 2026-07-15T00:15:00Z | Task-D-1 | completed | 1 | Orchestrator accepted batch-D re-review: default selection is exclusively is_default; legacy provider contracts and settings fallback are absent; focused typechecks/tests and scans passed. |
| 2026-07-15T00:22:30Z | Task-F-1 | ready_for_review | 1 | Task-F-1 ready: legacy runtime configuration writers are unregistered while GET routes remain; defaultProvider fallbacks removed in repository/gateway/runtime. Focused typechecks, 19 tests, scans, and diff check pass. |
| 2026-07-15T00:25:33Z | Task-F-1 | ready_for_review | 1 | Reviewer fix complete: guard uses Express 4 app._router.stack without touching throwing app.router getter; real Express regression test and apps/server typecheck pass. |
| 2026-07-15T00:27:00Z | Task-F-1 | completed | 1 | Orchestrator accepted Task-F-1: real Express runtime preserves reads/chat and removes legacy mutations; default selection has no defaultProvider fallback. |

## Requirements Coverage

| Requirement | Status | Covered By |
|-------------|--------|------------|
| REQ-001: Remove legacy provider code | [DONE] completed | Task-A-1, Task-B-2 |
| REQ-002: Use encrypted provider credentials at runtime | [DONE] completed | Task-A-1, Task-B-1 |
| REQ-003: Deprecate web as read-only | [DONE] completed | Task-B-2, Task-C-1 |
| REQ-004: Adjust package surface | [DONE] completed | Task-D-1 |

## Registry Parameters

Every parameter from `super-plan.json` is preserved below. This section is generated directly from the registry so the ledger remains a complete, auditable representation of the plan configuration and task data.

<details>
<summary>Complete <code>super-plan.json</code></summary>

````json
{
  "$schema": "https://raw.githubusercontent.com/gugacarbo/agents-skills/main/skills/super-planning/interfaces/super-plan.schema.json",
  "createdAt": "2026-07-14T23:01:58.727125+00:00",
  "planId": "0005-modelos-providers-legacy-cutover",
  "featureName": "modelos-providers-legacy-cutover",
  "status": "completed",
  "source": {
    "spec": "docs/specs/0005-modelos-providers-roteamento-spec.md",
    "plan": "docs/plans/0005-modelos-providers-legacy-cutover.md"
  },
  "goal": "Deprecate apps/web as read-only and remove all legacy provider contracts from the packages.",
  "architectureSummary": "ModelAdminService and the revisioned registry are the only provider aggregate; credentialEnvelope is decrypted only at the upstream boundary.",
  "techStack": [
    "TypeScript 6",
    "Drizzle ORM 0.38.4",
    "TanStack Start 1.168.27",
    "Express",
    "Vitest 4.1.5"
  ],
  "executionMode": "sequential",
  "reviewCadence": "per_batch",
  "agents": {
    "general": {
      "model": "",
      "agent": "",
      "effort": ""
    },
    "deep": {
      "model": "",
      "agent": "",
      "effort": ""
    },
    "quick": {
      "model": "",
      "agent": "",
      "effort": ""
    }
  },
  "branchStrategy": {
    "baseBranch": "main",
    "featureBranch": "codex/modelos-providers-legacy-cutover"
  },
  "worktree": {
    "enabled": true,
    "path": ".worktrees/codex-modelos-providers-legacy-cutover"
  },
  "globalConstraints": [
    "No secretRef or provider-table apiKey fallback",
    "No legacy provider writers",
    "apps/web is read-only",
    "TDD behavior changes"
  ],
  "fileStructure": [
    {
      "path": "services/llm-config-service/src",
      "ownerTask": "Task-A-1",
      "notes": "Remove legacy provider stack and provide encrypted runtime boundary."
    },
    {
      "path": "services/llm-gateway/src/resolver/upstream-provider.ts",
      "ownerTask": "Task-B-1",
      "notes": "Gateway upstream credential consumer."
    },
    {
      "path": "packages/server/src/routes/provider-routes.ts",
      "ownerTask": "Task-B-2",
      "notes": "Remove legacy provider writers."
    },
    {
      "path": "apps/web/src/features/models",
      "ownerTask": "Task-C-1",
      "notes": "Deprecated read-only UI."
    },
    {
      "path": "pnpm-lock.yaml",
      "ownerTask": "Task-D-1",
      "notes": "Package cleanup only after consumers move."
    }
  ],
  "requirementsChecklist": [
    {
      "id": "REQ-001",
      "title": "Remove legacy provider code",
      "source": "SPEC-0005 clean cut and user request",
      "status": "completed",
      "acceptanceCriteria": [
        "No operational ProvidersService, ProvidersRepository or providers dual-read remains."
      ],
      "coveredByTasks": [
        "Task-A-1",
        "Task-B-2"
      ],
      "notes": [
        "No compatibility layer."
      ]
    },
    {
      "id": "REQ-002",
      "title": "Use encrypted provider credentials at runtime",
      "source": "ADR-0007",
      "status": "completed",
      "acceptanceCriteria": [
        "Gateway only decrypts credentialEnvelope at the upstream boundary and fails closed."
      ],
      "coveredByTasks": [
        "Task-A-1",
        "Task-B-1"
      ],
      "notes": [
        "No secretRef environment fallback."
      ]
    },
    {
      "id": "REQ-003",
      "title": "Deprecate web as read-only",
      "source": "User request 2026-07-14",
      "status": "completed",
      "acceptanceCriteria": [
        "apps/web has retained reads and no provider/model writers."
      ],
      "coveredByTasks": [
        "Task-B-2",
        "Task-C-1"
      ],
      "notes": [
        "apps/ui remains the writer surface."
      ]
    },
    {
      "id": "REQ-004",
      "title": "Adjust package surface",
      "source": "User request 2026-07-14",
      "status": "completed",
      "acceptanceCriteria": [
        "Unused legacy exports and dependencies are removed after migration."
      ],
      "coveredByTasks": [
        "Task-D-1"
      ],
      "notes": []
    }
  ],
  "taskDirectory": "docs/jobs/0005-modelos-providers-legacy-cutover",
  "rules": [
    "Preserve unrelated user changes",
    "Use the approved worktree",
    "Do not remove unrelated API-key concepts",
    "Baseline pnpm verify -c fails before implementation because code-checks reports unrelated unused workspace exports",
    "The current subagent dispatcher has no model or effort selector; executor profiles fall back to the session default"
  ],
  "tasks": [
    {
      "id": "Task-A-1",
      "title": "Remove the legacy provider contract from llm-config-service",
      "description": "Delete the legacy provider repository, service, types, dual-read adapter and exports; provide a narrow encrypted credential resolver for runtime consumers.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "deep",
      "batch": "A",
      "layer": "foundation",
      "reportFile": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-A-1/report.md",
      "reviewPackage": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-A-1/review-package.diff.md",
      "progressLog": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-A-1/progress.log",
      "logTaskScript": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-A-1/log-task.sh",
      "baseCommit": "de03ad162c83b70e208ca80a713277c8da256be9",
      "dependencies": [],
      "acceptanceCriteria": [
        "No provider persistence type or export contains secretRef or a provider-table apiKey.",
        "The encrypted envelope resolver is server-only and fails closed.",
        "Focused service tests report RED then GREEN."
      ],
      "requirements": [
        "REQ-001",
        "REQ-002"
      ],
      "rules": [
        "TDD required.",
        "Read docs/context/testing-anti-patterns.md before test doubles.",
        "Do not add compatibility fallbacks."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Write regression tests",
          "description": "Add focused tests for the encrypted runtime resolver and absence of legacy provider behavior.",
          "command": "pnpm --filter @lite-llm/llm-config-service exec vitest run",
          "expectedResult": "New tests fail before implementation.",
          "codeExample": "expect(resolveProviderCredential(...)).rejects.toThrow()"
        },
        {
          "order": 2,
          "title": "Replace the legacy contract",
          "description": "Delete legacy provider files and wire the smallest new runtime-only adapter.",
          "command": "rg -n 'ProvidersService|secretRef' services/llm-config-service",
          "expectedResult": "Only intentional migration references remain during implementation.",
          "codeExample": "export async function resolveProviderCredential(...)"
        },
        {
          "order": 3,
          "title": "Verify the package",
          "description": "Run focused Vitest, typecheck and legacy-symbol scans.",
          "command": "pnpm --filter @lite-llm/llm-config-service typecheck",
          "expectedResult": "Exit 0.",
          "codeExample": "rg -n 'ProvidersService|ProvidersRepository' services/llm-config-service"
        }
      ],
      "filesTouched": [
        "services/llm-config-service/src/factory.ts",
        "services/llm-config-service/src/index.ts",
        "services/llm-config-service/src/repositories/providers-repository.ts",
        "services/llm-config-service/src/services/providers.service.ts",
        "services/llm-config-service/src/types/providers.ts",
        "services/llm-config-service/src/dual-read/providers-dual-read.ts"
      ],
      "files": {
        "created": [],
        "modified": [
          "services/llm-config-service/src/factory.ts",
          "services/llm-config-service/src/index.ts"
        ],
        "deleted": [
          "services/llm-config-service/src/repositories/providers-repository.ts",
          "services/llm-config-service/src/services/providers.service.ts",
          "services/llm-config-service/src/types/providers.ts",
          "services/llm-config-service/src/dual-read/providers-dual-read.ts"
        ]
      },
      "notes": [
        "New ModelAdminService is the provider aggregate."
      ]
    },
    {
      "id": "Task-B-1",
      "title": "Migrate gateway provider resolution to encrypted envelopes",
      "description": "Remove secretRef and plaintext apiKey resolution from the gateway and use the Task-A runtime credential boundary.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "deep",
      "batch": "B",
      "layer": "core",
      "reportFile": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-B-1/report.md",
      "reviewPackage": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-B-1/review-package.diff.md",
      "progressLog": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-B-1/progress.log",
      "logTaskScript": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-B-1/log-task.sh",
      "baseCommit": "de03ad162c83b70e208ca80a713277c8da256be9",
      "dependencies": [
        "Task-A-1"
      ],
      "acceptanceCriteria": [
        "Gateway resolves a valid encrypted provider credential only at the upstream boundary.",
        "Missing or corrupt envelopes fail closed without environment fallback.",
        "Focused gateway tests and typecheck pass."
      ],
      "requirements": [
        "REQ-002"
      ],
      "rules": [
        "TDD required.",
        "Read docs/context/testing-anti-patterns.md before test doubles.",
        "Never expose a decrypted credential."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Make tests fail",
          "description": "Replace secretRef fixtures with encrypted envelope cases and assert failure modes.",
          "command": "pnpm --filter @lite-llm/llm-gateway exec vitest run src/resolver/upstream-provider.test.ts",
          "expectedResult": "New envelope tests fail before implementation.",
          "codeExample": "credentialEnvelope: encryptedValue"
        },
        {
          "order": 2,
          "title": "Migrate the resolver",
          "description": "Use the server-only envelope resolver and remove secretRef/apiKey lookup.",
          "command": "rg -n 'secretRef|apiKey' services/llm-gateway/src/resolver",
          "expectedResult": "No upstream provider secret fallback remains.",
          "codeExample": "await resolveProviderCredential(provider)"
        },
        {
          "order": 3,
          "title": "Verify gateway",
          "description": "Run focused tests, typecheck and symbol scan.",
          "command": "pnpm --filter @lite-llm/llm-gateway typecheck",
          "expectedResult": "Exit 0.",
          "codeExample": "pnpm --filter @lite-llm/llm-gateway test"
        }
      ],
      "filesTouched": [
        "services/llm-gateway/src/resolver/upstream-provider.ts",
        "services/llm-gateway/src/resolver/upstream-provider.test.ts"
      ],
      "files": {
        "created": [],
        "modified": [
          "services/llm-gateway/src/resolver/upstream-provider.ts",
          "services/llm-gateway/src/resolver/upstream-provider.test.ts"
        ],
        "deleted": []
      },
      "notes": []
    },
    {
      "id": "Task-B-2",
      "title": "Remove legacy server and analytics provider writers",
      "description": "Replace RegistryServices provider dependencies and delete Express writer routes/consumers that target the removed provider service.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "deep",
      "batch": "B",
      "layer": "core",
      "reportFile": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-B-2/report.md",
      "reviewPackage": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-B-2/review-package.diff.md",
      "progressLog": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-B-2/progress.log",
      "logTaskScript": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-B-2/log-task.sh",
      "baseCommit": "de03ad162c83b70e208ca80a713277c8da256be9",
      "dependencies": [
        "Task-A-1"
      ],
      "acceptanceCriteria": [
        "No server route accepts a legacy provider secret write.",
        "Analytics reads the provider registry without secretRef.",
        "Focused server and analytics tests pass."
      ],
      "requirements": [
        "REQ-001",
        "REQ-003"
      ],
      "rules": [
        "TDD required.",
        "Read docs/context/testing-anti-patterns.md before test doubles.",
        "Retain only explicitly read-only legacy routes."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Identify public read boundary",
          "description": "Write regression coverage for retained read endpoints and removed writer endpoints.",
          "command": "pnpm --filter server exec vitest run",
          "expectedResult": "Legacy writer expectations fail before removal.",
          "codeExample": "expect(response.status).toBe(404)"
        },
        {
          "order": 2,
          "title": "Remove legacy consumer wiring",
          "description": "Update route options, factory consumers and analytics readers to the new contract.",
          "command": "rg -n 'providersService|secretRef' apps/server packages/server services/analytics-service",
          "expectedResult": "Legacy provider wiring is removed.",
          "codeExample": "ModelAdminService"
        },
        {
          "order": 3,
          "title": "Verify package consumers",
          "description": "Run focused tests, typechecks and deletion scans.",
          "command": "pnpm --filter server typecheck",
          "expectedResult": "Exit 0.",
          "codeExample": "pnpm --filter @lite-llm/analytics-service typecheck"
        }
      ],
      "filesTouched": [
        "packages/server/src/routes/provider-routes.ts",
        "packages/server/src/types/index.ts",
        "apps/server/src/runtime/app-runtime.ts",
        "services/analytics-service/src/data-source/registry-methods.ts"
      ],
      "files": {
        "created": [],
        "modified": [
          "packages/server/src/routes/provider-routes.ts",
          "packages/server/src/types/index.ts",
          "apps/server/src/runtime/app-runtime.ts",
          "services/analytics-service/src/data-source/registry-methods.ts"
        ],
        "deleted": []
      },
      "notes": []
    },
    {
      "id": "Task-C-1",
      "title": "Deprecate apps/web as a read-only provider and model surface",
      "description": "Remove mutating controls, mutations and HTTP client methods from apps/web while preserving its supported reads and showing the admin handoff.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "general",
      "batch": "C",
      "layer": "surface",
      "reportFile": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-C-1/report.md",
      "reviewPackage": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-C-1/review-package.diff.md",
      "progressLog": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-C-1/progress.log",
      "logTaskScript": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-C-1/log-task.sh",
      "baseCommit": "de03ad162c83b70e208ca80a713277c8da256be9",
      "dependencies": [
        "Task-B-2"
      ],
      "acceptanceCriteria": [
        "apps/web exposes no actionable create, update, delete, sync or provider-credential control.",
        "Read data remains renderable for admin and viewer.",
        "The deprecated surface directs admin changes to apps/ui and focused web tests pass."
      ],
      "requirements": [
        "REQ-003"
      ],
      "rules": [
        "TDD required.",
        "Read docs/context/testing-anti-patterns.md before test doubles.",
        "Do not delete read-only model/dashboard behavior outside scope."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Add read-only UI tests",
          "description": "Cover retained read rendering, absence of writer controls and the deprecation handoff.",
          "command": "pnpm --filter web exec vitest run",
          "expectedResult": "Read-only assertions fail before implementation.",
          "codeExample": "expect(screen.queryByRole('button', { name: /save/i })).toBeNull()"
        },
        {
          "order": 2,
          "title": "Remove mutations",
          "description": "Delete mutation hooks, API client writers and mutation UI from provider/model pages.",
          "command": "rg -n 'useMutation|createProvider|updateProvider|deleteProvider' apps/web/src/features/models",
          "expectedResult": "No provider/model writer remains in apps/web.",
          "codeExample": "Deprecated: manage models in apps/ui"
        },
        {
          "order": 3,
          "title": "Verify web",
          "description": "Run focused web tests, typecheck and build checks.",
          "command": "pnpm --filter web typecheck",
          "expectedResult": "Exit 0.",
          "codeExample": "pnpm --filter web build"
        }
      ],
      "filesTouched": [
        "apps/web/src/features/models/use-models-page.ts",
        "apps/web/src/features/models/use-providers-page.ts",
        "apps/web/src/features/models/providers-page.tsx",
        "apps/web/src/shared/lib/api-client/providers.ts"
      ],
      "files": {
        "created": [],
        "modified": [
          "apps/web/src/features/models/use-models-page.ts",
          "apps/web/src/features/models/use-providers-page.ts",
          "apps/web/src/features/models/providers-page.tsx",
          "apps/web/src/shared/lib/api-client/providers.ts"
        ],
        "deleted": []
      },
      "notes": [
        "apps/web remains deployed but deprecated."
      ]
    },
    {
      "id": "Task-D-1",
      "title": "Remove unused packages and verify the legacy cutover",
      "description": "Clean workspace exports, package dependencies and obsolete tests after all consumers are migrated, then execute the full focused verification matrix.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "general",
      "batch": "D",
      "layer": "final",
      "reportFile": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-D-1/report.md",
      "reviewPackage": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-D-1/review-package.diff.md",
      "progressLog": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-D-1/progress.log",
      "logTaskScript": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-D-1/log-task.sh",
      "baseCommit": "de03ad162c83b70e208ca80a713277c8da256be9",
      "dependencies": [
        "Task-B-1",
        "Task-B-2",
        "Task-C-1"
      ],
      "acceptanceCriteria": [
        "Package manifests and exports contain no unused legacy provider package surface.",
        "Focused package typechecks/tests pass.",
        "The final scan has no operational provider secretRef/apiKey/legacy provider service references."
      ],
      "requirements": [
        "REQ-004"
      ],
      "rules": [
        "Do not erase API-key concepts that are unrelated to upstream provider credentials.",
        "Preserve generated and user-owned files unless the task owns them."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Scan remaining symbols",
          "description": "Classify every remaining legacy provider reference before removal.",
          "command": "rg -n 'ProvidersService|ProvidersRepository|secretRef' services apps packages",
          "expectedResult": "Every hit is classified as unrelated or removed.",
          "codeExample": "rg -n 'secretRef' services apps packages"
        },
        {
          "order": 2,
          "title": "Clean exports and packages",
          "description": "Remove obsolete dependencies, exports and tests only after consumer migration.",
          "command": "pnpm install --lockfile-only",
          "expectedResult": "Lockfile reflects only remaining dependencies.",
          "codeExample": "pnpm --filter @lite-llm/llm-config-service typecheck"
        },
        {
          "order": 3,
          "title": "Run final verification",
          "description": "Run focused tests, typechecks, lint and deletion scans.",
          "command": "pnpm verify -c",
          "expectedResult": "Exit 0 or documented unrelated baseline issue.",
          "codeExample": "git diff --check"
        }
      ],
      "filesTouched": [
        "services/llm-config-service/package.json",
        "packages/server/package.json",
        "apps/web/package.json",
        "pnpm-lock.yaml"
      ],
      "files": {
        "created": [],
        "modified": [
          "services/llm-config-service/package.json",
          "packages/server/package.json",
          "apps/web/package.json",
          "pnpm-lock.yaml"
        ],
        "deleted": []
      },
      "notes": []
    },
    {
      "id": "Task-F-1",
      "title": "Remove final-audit legacy writers and default fallbacks",
      "description": "Address every Critical and Important finding from the whole-branch audit before closure.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "general",
      "batch": "F",
      "layer": "final",
      "reportFile": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-F-1/report.md",
      "reviewPackage": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-F-1/review-package.diff.md",
      "progressLog": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-F-1/progress.log",
      "logTaskScript": "docs/jobs/0005-modelos-providers-legacy-cutover/Task-F-1/log-task.sh",
      "baseCommit": "de03ad162c83b70e208ca80a713277c8da256be9",
      "dependencies": [
        "Task-D-1"
      ],
      "acceptanceCriteria": [
        "No legacy Express model/provider writer is registered outside apps/ui.",
        "Default provider resolution uses only model_proxy_providers.is_default.",
        "Focused route/gateway/repository tests and typechecks pass."
      ],
      "requirements": [
        "REQ-002",
        "REQ-004"
      ],
      "rules": [
        "Preserve apps/ui as the sole admin writer.",
        "Do not remove unrelated API-key concepts."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Remove registered legacy writers",
          "description": "Unregister/remove Express model and provider mutations outside apps/ui.",
          "command": "rg -n app\\.(post|put|delete|patch) packages/server apps/server",
          "expectedResult": "No legacy registered writers remain.",
          "codeExample": "rg -n app\\.put packages/server/src/routes"
        },
        {
          "order": 2,
          "title": "Remove default fallbacks",
          "description": "Resolve default only from is_default.",
          "command": "rg -n defaultProvider services repositories packages apps",
          "expectedResult": "No runtime selection fallback remains.",
          "codeExample": "rg -n defaultProvider services/llm-gateway"
        }
      ],
      "filesTouched": [
        "packages/server/src/routes/index.ts",
        "packages/server/src/routes/model-routes.ts",
        "services/llm-gateway/src/resolver/upstream-provider.ts",
        "repositories/models-repository/src/db-repository.ts"
      ],
      "files": {
        "created": [],
        "modified": [],
        "deleted": []
      },
      "notes": [
        "Created from final whole-branch audit findings."
      ]
    }
  ],
  "updatedAt": "2026-07-15T00:29:04.728006+00:00"
}
````

</details>
