# Models/Agents Config Split (No Legacy Compatibility) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split model/provider ownership out of `@agents/agents.jsonc` into `@models/models.jsonc` with new `models-repository` + `models-manager`, and remove all legacy compatibility paths.

**Architecture:** Hard cutover. Remove model/provider fields from agents domain immediately, move alias-router into models-manager, and update all imports/consumers in the same change set.

**Tech Stack:** TypeScript, pnpm workspace, Zod, Vitest, Turborepo.

---

### Task 1: Create `@models` domain files (hard source-of-truth)

**Files:**
- Create: `@models/models.jsonc`
- Create: `@models/models.schema.json`

- [ ] **Step 1: Create `@models/models.jsonc` with current `provider` + `models` data**

Copy the exact `provider` and `models` blocks from `@agents/agents.jsonc`.

- [ ] **Step 2: Create `@models/models.schema.json`**

Define strict root with only:
- `$schema`
- `version`
- `provider`
- `models`

Set `additionalProperties: false`.

- [ ] **Step 3: Format and validate json/jsonc shape**

Run:

```bash
pnpm format
```

Expected: PASS.


### Task 2: Create `repositories/models-repository`

**Files:**
- Create: `repositories/models-repository/package.json`
- Create: `repositories/models-repository/tsconfig.json`
- Create: `repositories/models-repository/src/index.ts`
- Create: `repositories/models-repository/src/repository.ts`
- Create: `repositories/models-repository/src/storage.ts`
- Create: `repositories/models-repository/src/repository.test.ts`
- Create: `repositories/models-repository/src/schemas/index.ts`
- Create: `repositories/models-repository/src/schemas/models-config.ts`
- Create: `repositories/models-repository/src/schemas/provider.ts`
- Create: `repositories/models-repository/src/schemas/model.ts`

- [ ] **Step 1: Write failing tests for repository contract**

Cover:
- JSONC read (comments + trailing commas)
- schema validation failure for malformed provider
- schema validation failure for malformed model
- write/read roundtrip

- [ ] **Step 2: Implement Zod schemas and exported types**

Root schema must be strict (`.strict()`).

- [ ] **Step 3: Implement repository methods**

Implement:
- `read`, `readSync`, `write`, `validate`, `exists`, `getPath`

- [ ] **Step 4: Run tests/typecheck**

Run:

```bash
pnpm --filter @lite-llm/models-repository test
pnpm --filter @lite-llm/models-repository typecheck
```

Expected: PASS.


### Task 3: Extract shared repository utilities (no duplication drift)

**Files:**
- Create/Modify shared utility location for JSON/JSONC parsing and file storage
- Modify: `repositories/agents-repository/src/repository.ts`
- Modify: `repositories/models-repository/src/repository.ts`

- [ ] **Step 1: Add tests to lock parser behavior**

Use same fixtures for both repositories.

- [ ] **Step 2: Move shared parser + storage helpers to a single shared module**

Shared logic:
- JSON/JSONC normalization
- parse error shape
- storage abstraction

- [ ] **Step 3: Rewire both repositories to shared module**

No behavior differences allowed.

- [ ] **Step 4: Re-run repository tests**

Run:

```bash
pnpm --filter @lite-llm/agents-repository test
pnpm --filter @lite-llm/models-repository test
```

Expected: PASS.


### Task 4: Create `packages/models-manager` and move alias-router into it

**Files:**
- Create: `packages/models-manager/package.json`
- Create: `packages/models-manager/tsconfig.json`
- Create: `packages/models-manager/src/index.ts`
- Create: `packages/models-manager/src/repository/client.ts`
- Create: `packages/models-manager/src/services/model.service.ts`
- Create: `packages/models-manager/src/services/provider.service.ts`
- Create: `packages/models-manager/src/alias-router/**`
- Create: `packages/models-manager/src/**/__tests__/*.test.ts`

- [ ] **Step 1: Write failing tests for services and alias exports**

Cover CRUD for models/providers and alias-router function availability.

- [ ] **Step 2: Move alias-router code into `models-manager/src/alias-router`**

Move all source modules previously in `packages/alias-router/src`.

- [ ] **Step 3: Implement repository client pointing to `@models/models.jsonc`**

Use explicit file path resolution for models domain.

- [ ] **Step 4: Implement `ModelService` and `ProviderService`**

Support operations:
- getAll/get/create/update/upsert/delete

- [ ] **Step 5: Run package validation**

Run:

```bash
pnpm --filter @lite-llm/models-manager test
pnpm --filter @lite-llm/models-manager typecheck
```

Expected: PASS.


### Task 5: Remove standalone alias-router package (hard cut)

**Files:**
- Delete: `packages/alias-router/**`
- Modify: root/workspace package references that include alias-router
- Modify: all imports from `@lite-llm/alias-router`

- [ ] **Step 1: Find all imports of `@lite-llm/alias-router` and write failing compile expectation**

Current known consumers include analytics and agents-manager plugin.

- [ ] **Step 2: Replace imports with `@lite-llm/models-manager` exports**

Update each consumer file directly.

- [ ] **Step 3: Remove `packages/alias-router` from workspace/build references**

Ensure no lingering dependency edges.

- [ ] **Step 4: Run impacted package checks**

Run:

```bash
pnpm --filter @lite-llm/analytics typecheck
pnpm --filter @lite-llm/agents-manager typecheck
pnpm --filter @lite-llm/models-manager typecheck
```

Expected: PASS.


### Task 6: Slim `agents-repository` schema and config immediately

**Files:**
- Modify: `repositories/agents-repository/src/schemas/db-config.ts`
- Modify: `repositories/agents-repository/src/schemas/index.ts`
- Modify: `repositories/agents-repository/src/repository.test.ts`
- Modify: `@agents/agents.jsonc`
- Modify: `@agents/agents.schema.json`

- [ ] **Step 1: Write failing tests asserting `provider/models` are invalid**

Strict schema must reject those keys.

- [ ] **Step 2: Remove `provider` and `models` from schema and types**

Keep agents-domain keys only:
- agents
- categories
- plugins
- metadata fields

- [ ] **Step 3: Remove `provider/models` blocks from `@agents/agents.jsonc`**

Do not preserve any legacy fallback fields.

- [ ] **Step 4: Validate repository package**

Run:

```bash
pnpm --filter @lite-llm/agents-repository test
pnpm --filter @lite-llm/agents-repository typecheck
```

Expected: PASS.


### Task 7: Remove model ownership from `agents-manager`

**Files:**
- Modify: `packages/agents-manager/src/index.ts`
- Modify: `packages/agents-manager/src/services/model.service.ts`
- Modify: `packages/agents-manager/src/services/__tests__/model.service.test.ts`
- Modify: `packages/agents-manager/src/plugins/external/litellm-alias.plugin.ts`

- [ ] **Step 1: Write failing tests for new boundary**

`agents-manager` should not read/write `config.models` anymore.

- [ ] **Step 2: Remove `ModelService` from agents-manager public factory/api**

Hard cut: model operations live only in models-manager.

- [ ] **Step 3: Update plugin imports to models-manager alias functions**

Replace any alias-router package dependency.

- [ ] **Step 4: Run agents-manager tests/typecheck**

Run:

```bash
pnpm --filter @lite-llm/agents-manager test
pnpm --filter @lite-llm/agents-manager typecheck
```

Expected: PASS.


### Task 8: Update remaining consumers + full verification

**Files:**
- Modify: `packages/analytics/src/queries/router-queries.ts`
- Modify: `packages/analytics/src/data-source/routing-methods.ts`
- Modify any additional grep matches

- [ ] **Step 1: Replace all alias and model-domain imports to new package boundary**

Target boundary: `@lite-llm/models-manager`.

- [ ] **Step 2: Run targeted checks first**

Run:

```bash
pnpm --filter @lite-llm/analytics test
pnpm --filter @lite-llm/analytics typecheck
pnpm --filter @lite-llm/server-core typecheck
```

Expected: PASS.

- [ ] **Step 3: Run workspace-wide validation**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: all PASS.


### Task 9: Documentation hard cut update

**Files:**
- Modify: root `AGENTS.md` where config ownership is documented
- Modify: `packages/agents-manager` docs
- Create/Modify: `packages/models-manager` docs
- Create/Modify: `repositories/models-repository` docs

- [ ] **Step 1: Document final ownership model**

Explicitly state:
- agents/categories/plugins in `@agents/agents.jsonc`
- provider/models in `@models/models.jsonc`

- [ ] **Step 2: Remove references to legacy compatibility paths**

No deprecation/wrapper text. Describe only final architecture.

- [ ] **Step 3: Final smoke build for new domains**

Run:

```bash
pnpm --filter @lite-llm/models-repository build
pnpm --filter @lite-llm/models-manager build
pnpm --filter @lite-llm/agents-repository build
```

Expected: PASS.
