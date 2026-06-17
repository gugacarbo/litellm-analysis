# Batch 3: Legacy One-Shot Import (SA-0C)

**Status:** specification (implementation in Onda 1+)  
**Date:** 2026-06-16  
**Scope:** one-shot migration of operational settings, upstream credentials, and model
registry from LiteLLM tables into `model_proxy_*`  
**Prerequisites:** Batch 1 schema; Batch 2 ledger without raw secrets in payloads;
[`batch-3-decisions.md`](./batch-3-decisions.md) and
[`batch-3-field-mapping.md`](./batch-3-field-mapping.md) (SA-0B)

This document defines the **read-only source → write target** mapping for the legacy
import adapters named in the Batch 3 RFC:

| Adapter | Source | Target |
|---------|--------|--------|
| `legacy-config-adapter` | `LiteLLM_Config` | `model_proxy_settings` |
| `legacy-credentials-adapter` | `LiteLLM_CredentialsTable` | `model_proxy_credentials` |
| `import-legacy-registry` | `LiteLLM_ProxyModelTable` | `model_proxy_models` |

The import is **one-shot / idempotent**: safe to re-run; does not dual-write back to
LiteLLM. Analytics (`LiteLLM_SpendLogs`, etc.) stays on the LiteLLM DB until Batch 4.

---

## Environment requirements

Both databases must be reachable at import time.

### Target — `model_proxy_*`

| Variable | Required | Notes |
|----------|----------|-------|
| `MODEL_PROXY_DATABASE_URL` | **Yes** | PostgreSQL URL for `@lite-llm/model-proxy-repository`. Schema must be migrated (`pnpm --filter @lite-llm/model-proxy-repository db:validate`). |

### Source — LiteLLM operational tables

| Variable | Required | Notes |
|----------|----------|-------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | **Yes** (unless `DATABASE_URL` set) | Used by `@lite-llm/litellm-repository` / `analytics-service` queries. |
| `DATABASE_URL` | Optional override | Full PostgreSQL URL; takes precedence over discrete `DB_*` vars (see `getBackupDatabaseUrlFromEnv`). |

The two databases may be the **same PostgreSQL instance** (different schemas) or
**separate instances** — the import script opens two clients and does not assume
colocation.

### Runtime env vars (after import)

Import **does not** inject secrets into the process environment. Operators must
configure env vars **before** the model proxy can resolve upstream credentials
(see [Post-import credential env vars](#post-import-credential-env-vars)).

| Variable | When needed |
|----------|-------------|
| Per-credential `secretRef` values | **Required** for production upstream auth after import |
| `MODEL_PROXY_UPSTREAM_API_KEY` | Dev/migration fallback when no per-credential secret resolves |
| `MODEL_PROXY_UPSTREAM_BASE_URL` | Optional global upstream base URL fallback |
| `MODEL_PROXY_API_KEY` | Local proxy client auth (unrelated to upstream credentials; see decisions §2) |

---

## Planned CLI

Implementation target: a script or `pnpm` task (e.g.
`pnpm --filter @lite-llm/model-proxy-registry-service import:legacy`) that:

1. Creates a row in `model_proxy_import_jobs` (`source = "litellm-operational"`,
   `status = "running"`).
2. Runs the three import phases in order (see below).
3. Writes a `summary` JSON (`inserted`, `updated`, `skipped`, `errors`) and sets
   `status = "completed"` or `"failed"`.

| Flag | Default | Behavior |
|------|---------|----------|
| `--dry-run` | off | Log actions; no writes to `model_proxy_*` |
| `--force` | off | Overwrite existing rows matched by natural key (see [Idempotency](#idempotency)) |
| `--only` | all | Restrict to `settings`, `credentials`, or `models` |

Without `--force`, rows that already exist in the target (by natural key) are
**skipped** and counted in `summary.skipped`.

---

## Import order

Foreign references are by **name**, not FK. Recommended phase order:

```mermaid
flowchart LR
  C[credentials] --> S[settings]
  C --> M[models]
  S --> M
```

1. **Credentials** — `model_proxy_models.credential_name` and
   `default_credential` setting reference credential **names**.
2. **Settings** — `default_credential`, `health_check_prompt`, `router_settings`.
3. **Models** — `litellm_params.litellm_credential_name` must resolve to an
   imported credential name (warn if missing; do not fail the whole job unless
   `--strict` is added later).

---

## 1. `LiteLLM_Config` → `model_proxy_settings`

**Source table:** `LiteLLM_Config` (`param_name` PK, `param_value` JSONB)  
**Target table:** `model_proxy_settings` (`key` unique, `value` JSONB)  
**Natural key:** `model_proxy_settings.key`

Current read paths (analytics-service):

| Setting | Query file | LiteLLM read |
|---------|------------|--------------|
| Default credential | `credential-settings-queries.ts` | `param_name = 'default_credential'` |
| Health-check prompt | `health-check-settings-queries.ts` | `param_name = 'general_settings'` → `param_value.health_check_prompt` |
| Router settings | `router-queries.ts` | `param_name = 'router_settings'` → full `param_value` |

### 1.1 `default_credential`

| Source | Target |
|--------|--------|
| `LiteLLM_Config.param_name = 'default_credential'` | `model_proxy_settings.key = 'default_credential'` |
| `param_value.default_credential` (string) | `value = { "default_credential": "<name>" }` |

**Absent source row:** skip (no delete of target). Deleting the default credential
in the new system is a separate CRUD operation (remove row with
`key = 'default_credential'`).

**Validation:** if `default_credential` names a credential not present in
`model_proxy_credentials` after phase 1, emit a **warning** in the job summary.

### 1.2 `health_check_prompt`

| Source | Target |
|--------|--------|
| `LiteLLM_Config.param_name = 'general_settings'` | `model_proxy_settings.key = 'health_check_prompt'` |
| `param_value.health_check_prompt` (string, trimmed) | `value = { "health_check_prompt": "<prompt>" }` |

**Extraction** mirrors `getHealthCheckPrompt()`:

- Ignore row if `param_value` is not an object.
- Ignore if `health_check_prompt` is missing, not a string, or empty after trim.
- Do **not** copy unrelated `general_settings` fields (`ui_access_mode`,
  `health_check_interval`, etc.) into `model_proxy_settings`.

### 1.3 `router_settings`

| Source | Target |
|--------|--------|
| `LiteLLM_Config.param_name = 'router_settings'` | `model_proxy_settings.key = 'router_settings'` |
| Entire `param_value` object | `value` = same object (deep copy) |

**Must preserve:**

- `model_group_alias` map (alias → target model name).
- `__lite_llm_analytics.managedModelGroupAliasKeys` array — used by
  `reconcileManagedAliases` in `router-queries.ts` / `updateRouterSettings`.

No transformation beyond JSON round-trip. Future registry code reads/writes this
blob via `settings.service`; LiteLLM_Config becomes read-only for migration
fallback only.

---

## 2. `LiteLLM_CredentialsTable` → `model_proxy_credentials`

**Source table:** `LiteLLM_CredentialsTable`  
**Target table:** `model_proxy_credentials`  
**Natural key:** `credential_name` → `name` (unique)

Current read path: `getAllCredentials()` in `key-queries.ts` (full table scan,
ordered by `credential_name`).

### Field mapping

| LiteLLM column / JSON path | Target column | Import rule |
|----------------------------|---------------|-------------|
| `credential_name` | `name` | Required; unique |
| `credential_info.custom_llm_provider` | `provider` | String or null |
| `credential_values.api_base` | `base_url` | String or null |
| `credential_values.api_key` | `secret_ref` + optional `api_key` | See [secret_ref policy](#secret_ref-policy) |
| `credential_id` | — | **Not** stored; new row gets `cuid()` |
| `created_at` / `updated_at` / `created_by` / `updated_by` | — | Dropped; target uses Prisma `@default(now())` / `@updatedAt` |

Other keys inside `credential_values` (e.g. `api_version`, provider-specific
fields) are **not** persisted in Batch 3 MVP unless added to the Prisma schema
later. Log `summary.warnings` for unexpected keys.

### `secret_ref` policy

Aligned with [`batch-3-decisions.md`](./batch-3-decisions.md) §1:

| Rule | Detail |
|------|--------|
| **New writes after import** | Service layer rejects raw `apiKey` on create/update |
| **Import-time handling of `credential_values.api_key`** | Never copy plaintext into logs or `model_proxy_import_jobs.summary` |
| **Preferred outcome** | Set `secret_ref` to a derived env var name; leave `api_key` **null** on insert |
| **Transitional outcome** | If operator passes `--allow-legacy-api-key` (discouraged): one-time copy into `api_key` for read-only runtime fallback (`upstream-provider.ts` order: `secretRef` → `apiKey` → provider env → `MODEL_PROXY_UPSTREAM_API_KEY`) |
| **No re-write on `--force`** | `--force` updates `provider`, `base_url`, `secret_ref`; still **must not** write new plaintext into `api_key` unless `--allow-legacy-api-key` |

#### Deriving `secret_ref` from `credential_name`

When `credential_values.api_key` is present (typical legacy row):

1. Normalize `credential_name`: uppercase, non-alphanumeric → `_`, collapse repeats.
2. Append `_API_KEY` if the result does not already end with `_API_KEY`.
3. Set `secret_ref` to that string (e.g. `"ATplus Router"` → `ATPLUS_ROUTER_API_KEY`).
4. Add to job summary `requiredEnvVars`: `{ "credential": "<name>", "secretRef": "<VAR>", "action": "set env var before proxy start" }`.

If `credential_values` has **no** `api_key` but references an env-style value
elsewhere, set `secret_ref` only when the source already stores an env **name**
(not a value).

If no `api_key` and no derivable ref: import row with `secret_ref = null`;
runtime falls back to provider `models.jsonc` or `MODEL_PROXY_UPSTREAM_API_KEY`.

**Operator action:** for each `requiredEnvVars` entry, export the former
`api_key` value into the named env var (secret manager, `.env`, deployment
config). The import script **must not** print secret values.

---

## 3. `LiteLLM_ProxyModelTable` → `model_proxy_models`

**Source table:** `LiteLLM_ProxyModelTable`  
**Target table:** `model_proxy_models`  
**Natural key:** `model_name` → `model_name` (unique)

Current read paths: `getAllModels()`, `getModelDetails()`, CRUD in
`model-queries.ts`.

### Row-level mapping

| LiteLLM | Target | Notes |
|---------|--------|-------|
| `model_name` | `model_name` | Upsert key |
| `litellm_params` | typed columns + `request_options` | Via SA-0B `litellmParams` → `toModelProxyRow` |
| `model_id` | — | New `id` (`cuid()`); legacy UUID not preserved |
| `model_info` | — | Not imported (metadata / access groups out of scope) |
| `created_by` / `updated_by` | — | Dropped |

### `litellm_params` → columns

Apply conversion rules from [`batch-3-field-mapping.md`](./batch-3-field-mapping.md):

| `litellm_params` key | `model_proxy_models` column |
|----------------------|----------------------------|
| `model` / `model_name` | `model_name` |
| `enabled` | `enabled` (default `true`) |
| `input_cost_per_token` | `input_cost_per_token` |
| `output_cost_per_token` | `output_cost_per_token` |
| `context_window_size` | `context_window_size` |
| `max_tokens` | `max_output_tokens` |
| `litellm_credential_name` | `credential_name` |
| `api_base` | `upstream_base_url` |
| `custom_llm_provider` | `owned_by` and/or `family` (ignore sentinel `litellm_proxy` when config supplies real provider) |
| `model` (upstream id ≠ alias) | `upstream_model` |
| All other keys | `request_options` JSON |

**Display / config-only fields** (`display_name`, `api_mode`, `vision`) stay
empty unless present in `models.jsonc` sync later — import does not read JSONC.

**Per-model `secret_ref`:** not set from LiteLLM rows today; upstream auth
resolves via `credential_name` → `model_proxy_credentials`.

### Duplicate `model_name` in LiteLLM

`LiteLLM_ProxyModelTable` has no unique constraint on `model_name` in all
deployments. Import should:

- Process rows ordered by `updated_at DESC`.
- Keep the first row per `model_name`; log duplicates as warnings.

---

## Idempotency

| Target table | Natural key | Default re-import | With `--force` |
|--------------|-------------|-------------------|----------------|
| `model_proxy_settings` | `key` | Skip if row exists | `UPDATE value` (+ `updated_at`) from LiteLLM source |
| `model_proxy_credentials` | `name` | Skip if row exists | Update `provider`, `base_url`, `secret_ref` per policy; never refresh `api_key` without `--allow-legacy-api-key` |
| `model_proxy_models` | `model_name` | Skip if row exists | Full column refresh from latest `litellm_params` conversion |

**Upsert semantics:** implement as `findUnique` on natural key → insert or skip/update.
Use a single transaction per phase optional; partial completion is recorded in
`model_proxy_import_jobs.summary`.

**Checksum (optional enhancement):** store a hash of source JSON in job summary to
detect LiteLLM drift; re-run with `--force` only when drift is intentional.

**LiteLLM source:** always read-only. Import never executes the write paths in
`credential-settings-queries.ts`, `router-queries.ts`, or `model-queries.ts`
against LiteLLM.

---

## Post-import credential env vars

After a successful import, upstream requests resolve credentials in this order
(`upstream-provider.ts`):

1. `model_proxy_models.secret_ref` → `process.env[secretRef]`
2. `model_proxy_credentials.secret_ref` → `process.env[secretRef]`
3. `model_proxy_credentials.api_key` (legacy column; empty if policy followed)
4. Provider entry in `models.jsonc` (`apiKey` with optional `env:` prefix)
5. `MODEL_PROXY_UPSTREAM_API_KEY`

### Checklist for operators

1. Read `model_proxy_import_jobs.summary.requiredEnvVars` (or query
   `model_proxy_credentials` where `secret_ref IS NOT NULL`).
2. For each `secret_ref`, set `export <SECRET_REF>='<former-api-key>'` in the
   deployment environment (never commit values to git).
3. Restart model proxy / server processes so `process.env` is reloaded.
4. Run a health-check or single chat completion against each provider alias.
5. (Optional) Rotate keys: create new upstream keys, update env vars, clear any
   transitional `api_key` column rows.

### Example

Legacy row (`LiteLLM_CredentialsTable`):

```json
{
  "credential_name": "openai-main",
  "credential_values": { "api_key": "sk-…", "api_base": "https://api.openai.com/v1" },
  "credential_info": { "custom_llm_provider": "openai" }
}
```

Imported row (`model_proxy_credentials`):

| Column | Value |
|--------|-------|
| `name` | `openai-main` |
| `provider` | `openai` |
| `base_url` | `https://api.openai.com/v1` |
| `secret_ref` | `OPENAI_MAIN_API_KEY` |
| `api_key` | `null` |

Required before proxy works:

```bash
export OPENAI_MAIN_API_KEY='sk-…'   # value from legacy store, not from import logs
```

---

## Out of scope (this import)

- `LiteLLM_SpendLogs` / analytics history (Batch 4)
- `LiteLLM_AgentsTable`, verification tokens, budgets
- `model_proxy_api_keys` (local proxy keys — separate bootstrap; see decisions §2)
- `model_proxy_aliases` as a separate table (aliases remain inside
  `router_settings.value.model_group_alias` for Batch 3)
- Writing back to any LiteLLM table

---

## References

- Decisions: [`batch-3-decisions.md`](./batch-3-decisions.md)
- Field matrix: [`batch-3-field-mapping.md`](./batch-3-field-mapping.md)
- Prisma target schema:
  [`repositories/model-proxy-repository/prisma/schema.prisma`](../repositories/model-proxy-repository/prisma/schema.prisma)
- Source queries:
  - [`credential-settings-queries.ts`](../services/analytics-service/src/queries/credential-settings-queries.ts)
  - [`health-check-settings-queries.ts`](../services/analytics-service/src/queries/health-check-settings-queries.ts)
  - [`router-queries.ts`](../services/analytics-service/src/queries/router-queries.ts)
  - [`model-queries.ts`](../services/analytics-service/src/queries/model-queries.ts)
  - [`key-queries.ts`](../services/analytics-service/src/queries/key-queries.ts)
- Upstream resolution:
  [`upstream-provider.ts`](../services/model-proxy-service/src/resolver/upstream-provider.ts)
- Batch 3 checklist:
  [`litellm-removal-batch-3-settings-registry-credentials.md`](./litellm-removal-batch-3-settings-registry-credentials.md)
