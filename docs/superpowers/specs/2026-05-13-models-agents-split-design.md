# Design: Split models/providers from agents config

Date: 2026-05-13
Status: Draft approved in chat; pending final file review
Owner: Loom + user

## 1) Objective

Restructure configuration boundaries so `@agents/agents.jsonc` contains only
agent-focused data, while model/provider data moves to a dedicated models
configuration and repository layer.

### Requested target

- Keep in `@agents/agents.jsonc`:
  - `agents`
  - `categories`
  - `plugins`
  - (and existing config metadata like `$schema`, `version`)
- Move out of `@agents/agents.jsonc`:
  - `provider`
  - `models`
- Create:
  - `@models/models.jsonc` (or `.json`) as source-of-truth for models/providers
  - `repositories/models-repository` for persistence + schema validation
  - `packages/models-manager` as service layer over models-repository
- Merge current `packages/alias-router` responsibilities into
  `packages/models-manager`.

## 2) Scope and non-goals

### In scope

1. New models config domain (`@models/*`)
2. New repository package for models/providers
3. New manager package for models services and alias routing
4. Agents config schema/repository updates to remove models/providers fields
5. Integration wiring updates in consumers that currently depend on
   `@lite-llm/agents-repository` model/provider fields

### Out of scope (for this iteration)

1. Broad unrelated refactors in apps/web/apps/server
2. Re-designing model/category semantics
3. Changing plugin output contracts unless required for compile/runtime

## 3) Current-state summary

The current `@agents/agents.jsonc` mixes multiple concerns:

- Infra/model catalog concern: `provider`, `models`
- Agent orchestration concern: `agents`, `categories`, `plugins`

`repositories/agents-repository` validates and persists all of the above using a
single `DbConfig` schema. `packages/agents-manager` includes a `ModelService`
that reads/writes `config.models` from that same repository.

`packages/alias-router` is currently separate and contains pure model-alias
resolution/generation logic.

## 4) Proposed architecture

### 4.1 Boundary split

#### Agents domain

- Source file: `@agents/agents.jsonc`
- Owner package: `repositories/agents-repository`
- Data:
  - `agents`
  - `categories`
  - `plugins`
  - config metadata fields (`$schema`, `version`)
  - `globalFallbackModel` kept here initially for compatibility unless migration
    shows cleaner ownership in models domain

#### Models domain

- Source file: `@models/models.jsonc`
- Owner package: `repositories/models-repository`
- Data:
  - `provider`
  - `models`
  - config metadata fields (`$schema`, `version`)

### 4.2 New package topology

- `repositories/models-repository`
  - `repository.ts`: read/write/validate/exists/getPath
  - `schemas/`:
    - `models-config.ts` (root)
    - `provider.ts`
    - `model.ts` (or reused from existing schema)
  - `storage.ts` (or shared utility import)
  - `index.ts` exports types + factory

- `packages/models-manager`
  - `repository/client.ts` (path resolution + JSON/JSONC fallback behavior)
  - `services/model.service.ts`
  - `services/provider.service.ts`
  - embedded `alias-router/` module migrated from `packages/alias-router/src`
  - `index.ts` re-exports service APIs + alias helpers

### 4.3 Alias-router migration

Move `packages/alias-router/src/*` into `packages/models-manager/src/alias-router/*`.

Compatibility strategy (recommended):

1. Keep `packages/alias-router` temporarily as thin re-export wrapper to
   `@lite-llm/models-manager`.
2. Mark deprecated in README/changelog for planned removal in a later cycle.

This reduces immediate breakage risk for existing imports.

## 5) Shared code opportunities

The two repositories can share infrastructure with minimal coupling.

### Share now (high value, low risk)

1. JSON/JSONC parser normalization helpers:
   - comment stripping
   - trailing comma removal
2. Generic storage abstraction:
   - `IStorage`
   - `FileStorage`
3. Optional path utility for monorepo root resolution in repository clients
4. Create a new package for shared code if needed

### Consider later (optional)

1. Shared schema atoms (`cost`, possibly `limits`) in a common internal module
2. Generic base repository helper if both repositories keep identical lifecycle

## 6) Data contracts

### 6.1 `@agents/agents.jsonc` (post-split)

Contains:

- `$schema`
- `version`
- `agents`
- `categories`
- `plugins`
- optional compatibility fields kept only if strictly needed during migration

Removes:

- `provider`
- `models`

### 6.2 `@models/models.jsonc` (new)

Contains:

- `$schema` (e.g. `./models.schema.json`)
- `version`
- `provider`
- `models`

## 7) Integration impacts

1. **agents-manager**
   - Remove/rework direct dependency on `config.models` in
     `ModelService` from agents repository.
   - Option A (preferred): remove `ModelService` from agents-manager and consume
     models via models-manager.

2. **plugin flows using alias mapping**
   - Migrate alias imports to models-manager exports.

3. **routes/services in server-core and apps/server**
   - Any endpoint mutating models/providers should switch to models-manager.

4. **frontend consumers**
   - If they fetch merged data, backend should provide composition boundary so UI
     contract remains stable where possible.

## 8) Error handling and migration safety

1. Fail-fast schema validation for both configs at repository read/write.
2. Keep deterministic error messages indicating which file failed parse/validation.
3. Transitional compatibility layer allowed briefly:
   - if models file missing, optional fallback read from legacy location can be
     enabled only during migration window, then removed.

## 9) Testing strategy

Minimum tests required:

1. `models-repository`
   - reads/writes valid `.json` and `.jsonc`
   - rejects invalid provider/model schema
   - exists/getPath/validate behavior

2. `agents-repository` (after split)
   - validates config without `provider/models`
   - rejects unknown/legacy fields if schema is strict

3. `models-manager`
   - CRUD for models/providers
   - alias resolution/generation behavior parity with old alias-router tests

4. Compatibility package (if kept)
   - alias-router re-export smoke test

5. Workspace verification
   - typecheck/build/tests for affected packages

## 10) Rollout plan (recommended: phased)

### Phase 1: Introduce new domain in parallel

1. Add `@models/models.jsonc` + schema
2. Create `models-repository`
3. Create `models-manager` and migrate alias-router logic
4. Wire consumers progressively while preserving compatibility

### Phase 2: Finalize split

1. Remove `provider/models` from `@agents/agents.jsonc`
2. Update `agents-repository` schema/contracts
3. Remove temporary compatibility fallbacks
4. Optionally deprecate/remove standalone `alias-router` package

## 11) Risks and mitigations

1. **Risk:** break imports due to alias-router move
   - **Mitigation:** temporary re-export wrapper package

2. **Risk:** hidden runtime coupling expecting single config file
   - **Mitigation:** identify consumers and provide composition at service layer

3. **Risk:** migration drift between two files
   - **Mitigation:** scripted migration and schema version bump with checks

## 12) Success criteria

1. `@agents/agents.jsonc` contains no `provider/models`
2. `@models/models.jsonc` is sole source-of-truth for provider/model catalog
3. `models-repository` + `models-manager` are used by model-related operations
4. alias-routing behavior remains equivalent after migration
5. build/typecheck/tests pass for touched workspaces

## 13) Open decision log

1. **File extension for models config**: prefer `.jsonc` for parity with current
   edit workflow.
2. **`globalFallbackModel` ownership**: keep in agents domain initially for
   compatibility; revisit after integration sweep.
