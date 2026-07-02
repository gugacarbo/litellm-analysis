# Batch 3: Field Mapping — litellmParams ↔ modelRoute ↔ model_proxy_models

> Historical note: this field map was written during the transitional dual-read period.
> Any reference to `models.jsonc` below is historical and is superseded by spec 0002 /
> Task-C-0002: the operational source of truth now lives in `model_proxy_models` and
> `model_proxy_providers`, with older config payloads retained only for compatibility.

Canonical reference for SA-2A adapters and registry CRUD. Source of truth for **new writes**:
`model_proxy_models` columns + `requestOptions` JSON. `litellmParams` remains a legacy
read/write shape via adapters until Batch 4.

## Naming conventions

| Layer | Convention | Example |
|-------|------------|---------|
| Legacy LiteLLM JSON (`litellm_params`) | `snake_case` | `input_cost_per_token` |
| TypeScript `ModelRoute` / API (new) | `camelCase` | `inputCostPerToken` |
| Prisma `ModelProxyModel` | `camelCase` field → `snake_case` column | `inputCostPerToken` → `input_cost_per_token` |

## Full field matrix

### Identity and presence

| litellmParams (legacy) | modelRoute (new) | Prisma `model_proxy_models` | Notes |
|------------------------|------------------|-----------------------------|-------|
| — | `id` | `id` | Registry-only; not in litellmParams |
| `model` | `modelName` | `modelName` (`model_name`) | Primary alias; `applyRequiredLiteLLMParams` sets `model` = name |
| `model_name` | `modelName` | `modelName` (`model_name`) | Duplicate of `model` in legacy payloads; collapsed to one column |
| — | `displayName` | `displayName` (`display_name`) | Registry-backed metadata field |

### Enabled

| litellmParams (legacy) | modelRoute (new) | Prisma `model_proxy_models` | Notes |
|------------------------|------------------|-----------------------------|-------|
| `enabled` | `enabled` | `enabled` | Default `true`; also compared in sync-batch (`SyncField`) |

### Costs (USD per token)

| litellmParams (legacy) | modelRoute (new) | Prisma `model_proxy_models` | Notes |
|------------------------|------------------|-----------------------------|-------|
| `input_cost_per_token` | `inputCostPerToken` | `inputCostPerToken` (`input_cost_per_token`) | Canonical unit: USD/token (`toCostPerToken`) |
| `output_cost_per_token` | `outputCostPerToken` | `outputCostPerToken` (`output_cost_per_token`) | Same unit as LiteLLM |

### Context / limits

| litellmParams (legacy) | modelRoute (new) | Prisma `model_proxy_models` | Notes |
|------------------------|------------------|-----------------------------|-------|
| `context_window_size` | `contextWindowSize` | `contextWindowSize` (`context_window_size`) | Maps to dashboard model limits |
| `max_tokens` | `maxOutputTokens` | `maxOutputTokens` (`max_output_tokens`) | Maps to dashboard model output limits |

### Credential / provider linkage

| litellmParams (legacy) | modelRoute (new) | Prisma `model_proxy_models` | Notes |
|------------------------|------------------|-----------------------------|-------|
| `provider_name` | `providerName` | `providerName` (`provider_name`) | Links each model row to `model_proxy_providers.name` |
| `api_base` | `upstreamBaseUrl` | `upstreamBaseUrl` (`upstream_base_url`) | Optional per-model override over provider base URL |
| `model` (when upstream id ≠ alias) | `upstreamModel` | `upstreamModel` (`upstream_model`) | Defaults to `modelName` when unset (`resolveUpstreamTarget`) |
| — | `secretRef` | `secretRef` (`secret_ref`) | Optional per-model env var name; provider-level secrets live in `model_proxy_providers` |

Provider rows are separate from model routes:

| Registry table | Key field | Notes |
|----------------|-----------|-------|
| `model_proxy_providers` | `name` | Canonical provider identity |
| `model_proxy_providers` | `base_url` / `secret_ref` | Default upstream resolution inputs |

### Provider / upstream metadata

| litellmParams (legacy) | modelRoute (new) | Prisma `model_proxy_models` | Notes |
|------------------------|------------------|-----------------------------|-------|
| `custom_llm_provider` | `ownedBy` / `family` | `ownedBy` (`owned_by`), `family` | Legacy provider hint; the operational provider row now comes from `providerName` |
| — | `apiMode` | `apiMode` (`api_mode`) | `"openai"` \| `"anthropic"` |
| — | `vision` | `vision` | Boolean |

### Auto-injected legacy flags → requestOptions or drop

These are set by `applyRequiredLiteLLMParams` in
[`lite-llm-params.ts`](../packages/server/src/orchestration/lite-llm-params.ts) and have **no**
dedicated Prisma column. On import to registry they land in `requestOptions` if present in
source JSON; adapters may omit them when round-tripping to `modelRoute`.

| litellmParams (legacy) | modelRoute (new) | Prisma | Notes |
|------------------------|------------------|--------|-------|
| `use_litellm_proxy` | — | `requestOptions.use_litellm_proxy` | Always `false` when auto-applied |
| `use_in_pass_through` | — | `requestOptions.use_in_pass_through` | Always `false` when auto-applied |
| `merge_reasoning_content_in_choices` | — | `requestOptions.merge_reasoning_content_in_choices` | Always `false` when auto-applied |

### Config-adjacent fields

Compared during sync-batch alongside registry row; retained in API payloads for
dashboard compatibility.

| Dashboard config field | modelRoute overlap | Prisma column | Sync |
|------------------------|-------------------|---------------|------|
| `displayName` | `displayName` | `displayName` | config ↔ registry via dedicated sync (future) |
| `family` | `family` | `family` | config ↔ registry |
| `ownedBy` | `ownedBy` | `ownedBy` | config ↔ registry |
| `apiMode` | `apiMode` | `apiMode` | config-adjacent metadata |
| `vision` | `vision` | `vision` | config-adjacent metadata |
| `limits.length` | `contextWindowSize` | `contextWindowSize` | `SyncField: context_window_size` |
| `limits.maxOutput` | `maxOutputTokens` | `maxOutputTokens` | `SyncField: max_tokens` |
| `cost.input` | `inputCostPerToken` | `inputCostPerToken` | `SyncField: input_cost_per_token` |
| `cost.output` | `outputCostPerToken` | `outputCostPerToken` | `SyncField: output_cost_per_token` |
| `enabled` | `enabled` | `enabled` | `SyncField: enabled` |
| `thinking`, `reasoning` | — | — | Retained in compatibility metadata payloads; not first-class routing columns |

### Free-form fields → `requestOptions`

Any `litellmParams` key **not** listed in [Reserved keys](#reserved-keys-first-class-columns) is
stored verbatim (after `coerceLiteLLMParams`) in `requestOptions` JSON.

Examples commonly seen in extra-params UI:

| litellmParams (legacy) | modelRoute | Prisma |
|------------------------|------------|--------|
| `temperature` | `requestOptions.temperature` | `requestOptions` |
| `top_p` | `requestOptions.top_p` | `requestOptions` |
| `rpm` / `tpm` | `requestOptions.rpm` / `.tpm` | `requestOptions` |
| Provider-specific kwargs | `requestOptions.<key>` | `requestOptions` |

UI fixed keys excluded from "extra" bucket:
[`FIXED_KEYS`](../apps/web/src/features/models/model-form-data.ts) =
`api_base`, costs, context, `max_tokens`, `enabled`.

### Registry metadata (not in litellmParams)

| modelRoute | Prisma | Notes |
|------------|--------|-------|
| — | `createdAt` (`created_at`) | Auto |
| — | `updatedAt` (`updated_at`) | Auto |

## Reserved keys (first-class columns)

Keys absorbed into dedicated columns during `litellmParams` → `ModelProxyModel` conversion
(SA-2A `toModelProxyRow`):

```txt
model
model_name
enabled
input_cost_per_token
output_cost_per_token
context_window_size
max_tokens
provider_name
litellm_provider_name
api_base
custom_llm_provider
```

All other keys → `requestOptions`. Optional legacy flags (`use_litellm_proxy`, etc.) may be
preserved in `requestOptions` when importing existing LiteLLM rows.

## Conversion rules (summary)

### litellmParams → modelRoute / row

1. `modelName` ← `model` ?? `model_name` ?? caller-supplied name.
2. Typed scalars map 1:1 (snake → camel) per tables above.
3. `provider_name` / `litellm_provider_name` → `providerName`.
4. `api_base` → `upstreamBaseUrl`.
5. `custom_llm_provider` → prefer existing `ownedBy`, else `family`, else param value.
6. Remaining keys → `requestOptions` (deep-merge not required; flat object).
7. `enabled` defaults to `true` when absent.

### modelRoute / row → litellmParams (legacy shim)

1. Emit `model` and `model_name` = `modelName`.
2. Emit typed scalars as snake_case.
3. Emit `provider_name` when `providerName` is set.
4. `upstreamBaseUrl` → `api_base`.
5. `ownedBy` or `family` → `custom_llm_provider` (adapter picks primary per export target).
6. Spread `requestOptions` into root (later keys do not override first-class fields).
7. Run `applyRequiredLiteLLMParams` before LiteLLM DB write.

### Dashboard config ↔ registry (sync-batch fields)

| SyncField (API) | Config path | modelRoute / Prisma field |
|-----------------|-------------|---------------------------|
| `model_presence` | key in config record | row exists |
| `enabled` | `enabled` | `enabled` |
| `context_window_size` | `limits.length` | `contextWindowSize` |
| `max_tokens` | `limits.maxOutput` | `maxOutputTokens` |
| `input_cost_per_token` | `cost.input` | `inputCostPerToken` |
| `output_cost_per_token` | `cost.output` | `outputCostPerToken` |

Legacy sync direction names map to Batch 3 names (see
[`sync-status.ts`](../services/model-proxy-config-service/src/types/sync-status.ts)).

## API response shape (target)

```json
{
  "modelName": "my-alias",
  "status": "synced",
  "enabled": true,
  "modelRoute": {
    "modelName": "my-alias",
    "enabled": true,
    "providerName": "openai-main",
    "inputCostPerToken": 0.000003,
    "outputCostPerToken": 0.000015,
    "contextWindowSize": 200000,
    "maxOutputTokens": 8192,
    "upstreamBaseUrl": "https://api.openai.com/v1",
    "ownedBy": "openai",
    "requestOptions": { "temperature": 0.2 }
  },
  "litellmParams": { "...": "deprecated alias of modelRoute as snake_case record" },
  "config": { "displayName": "...", "family": "...", "ownedBy": "..." }
}
```

## References

- Prisma schema: [`repositories/model-proxy-repository/prisma/schema.prisma`](../repositories/model-proxy-repository/prisma/schema.prisma)
- Legacy builders: [`packages/server/src/orchestration/lite-llm-params.ts`](../packages/server/src/orchestration/lite-llm-params.ts)
- Upstream resolver: [`services/llm-gateway/src/resolver/upstream-provider.ts`](../services/llm-gateway/src/resolver/upstream-provider.ts)
- Batch 3 plan: [`.cursor/plans/batch_3_implementation_plan_73d35577.plan.md`](../../.cursor/plans/batch_3_implementation_plan_73d35577.plan.md)
