# Batch 3: Field Mapping — litellmParams ↔ modelRoute ↔ model_proxy_models

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
| — | `displayName` | `displayName` (`display_name`) | Lives in `models.jsonc` today; registry column for proxy listing |

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
| `context_window_size` | `contextWindowSize` | `contextWindowSize` (`context_window_size`) | Maps to `models.jsonc` `limits.length` |
| `max_tokens` | `maxOutputTokens` | `maxOutputTokens` (`max_output_tokens`) | Maps to `models.jsonc` `limits.maxOutput` |

### Credential (upstream auth reference)

| litellmParams (legacy) | modelRoute (new) | Prisma `model_proxy_models` | Notes |
|------------------------|------------------|-----------------------------|-------|
| `litellm_credential_name` | `credentialName` | `credentialName` (`credential_name`) | Resolved via `getCredentialNameFromParams` / `resolveModelCredential` |
| — | `secretRef` | `secretRef` (`secret_ref`) | Per-model env var name; **not** in litellmParams today; MVP writes use `secret_ref` not raw keys |

Credential **rows** (`model_proxy_credentials`) are separate from model route:

| Legacy `LiteLLM_CredentialsTable` | Registry column | Notes |
|-----------------------------------|-----------------|-------|
| `credential_name` | `name` | Unique key |
| `custom_llm_provider` | `provider` | Optional provider hint |
| `api_base` | `baseUrl` (`base_url`) | Upstream base URL fallback |
| `api_key` (legacy import) | `apiKey` (`api_key`) | Read-only import; **new writes reject** raw key |
| — | `secretRef` (`secret_ref`) | MVP: env var name for upstream API key |

### Provider / upstream routing

| litellmParams (legacy) | modelRoute (new) | Prisma `model_proxy_models` | Notes |
|------------------------|------------------|-----------------------------|-------|
| `custom_llm_provider` | `ownedBy` / `family` | `ownedBy` (`owned_by`), `family` | `applyRequiredLiteLLMParams` forces `"litellm_proxy"` for dashboard-managed models; real provider comes from `models.jsonc` `ownedBy`/`family` or registry columns |
| `api_base` | `upstreamBaseUrl` | `upstreamBaseUrl` (`upstream_base_url`) | UI "API Base"; resolver precedence: row → provider → credential → env |
| `model` (when upstream id ≠ alias) | `upstreamModel` | `upstreamModel` (`upstream_model`) | Defaults to `modelName` when unset (`resolveUpstreamTarget`) |
| — | `apiMode` | `apiMode` (`api_mode`) | `"openai"` \| `"anthropic"`; from `models.jsonc` today |
| — | `vision` | `vision` | Boolean; from `models.jsonc` today |

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

### Config-only fields (`models.jsonc` — not in litellmParams)

Compared during sync-batch alongside registry row; stored in JSONC, not in
`LiteLLM_ProxyModelTable.litellm_params`.

| models.jsonc (`ModelSpec`) | modelRoute overlap | Prisma column | Sync |
|----------------------------|-------------------|---------------|------|
| `displayName` | `displayName` | `displayName` | config ↔ registry via dedicated sync (future) |
| `family` | `family` | `family` | config ↔ registry |
| `ownedBy` | `ownedBy` | `ownedBy` | config ↔ registry |
| `apiMode` | `apiMode` | `apiMode` | config-only today |
| `vision` | `vision` | `vision` | config-only today |
| `limits.length` | `contextWindowSize` | `contextWindowSize` | `SyncField: context_window_size` |
| `limits.maxOutput` | `maxOutputTokens` | `maxOutputTokens` | `SyncField: max_tokens` |
| `cost.input` | `inputCostPerToken` | `inputCostPerToken` | `SyncField: input_cost_per_token` |
| `cost.output` | `outputCostPerToken` | `outputCostPerToken` | `SyncField: output_cost_per_token` |
| `enabled` | `enabled` | `enabled` | `SyncField: enabled` |
| `thinking`, `reasoning` | — | — | Stay in `models.jsonc` only (Batch 3) |

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
`api_base`, costs, context, `max_tokens`, `litellm_credential_name`, `enabled`.

### Registry metadata (not in litellmParams)

| modelRoute | Prisma | Notes |
|------------|--------|-------|
| — | `createdAt` (`created_at`) | Auto |
| — | `updatedAt` (`updated_at`) | Auto |

## Reserved keys (first-class columns)

Keys absorbed into dedicated columns during `litellmParams` → `ModelProxyModel` conversion
(SA-2A `toModelProxyRow`):

```
model
model_name
enabled
input_cost_per_token
output_cost_per_token
context_window_size
max_tokens
litellm_credential_name
api_base
custom_llm_provider
```

All other keys → `requestOptions`. Optional legacy flags (`use_litellm_proxy`, etc.) may be
preserved in `requestOptions` when importing existing LiteLLM rows.

## Conversion rules (summary)

### litellmParams → modelRoute / row

1. `modelName` ← `model` ?? `model_name` ?? caller-supplied name.
2. Typed scalars map 1:1 (snake → camel) per tables above.
3. `api_base` → `upstreamBaseUrl`.
4. `custom_llm_provider` → prefer existing `ownedBy`, else `family`, else param value (ignore sentinel `litellm_proxy` when `ownedBy`/`family` set in config).
5. Remaining keys → `requestOptions` (deep-merge not required; flat object).
6. `enabled` defaults to `true` when absent.

### modelRoute / row → litellmParams (legacy shim)

1. Emit `model` and `model_name` = `modelName`.
2. Emit typed scalars as snake_case.
3. `upstreamBaseUrl` → `api_base`.
4. `ownedBy` or `family` → `custom_llm_provider` (adapter picks primary per export target).
5. Spread `requestOptions` into root (later keys do not override first-class fields).
6. Run `applyRequiredLiteLLMParams` before LiteLLM DB write.

### models.jsonc ↔ registry (sync-batch fields)

| SyncField (API) | models.jsonc path | modelRoute / Prisma field |
|-----------------|-------------------|---------------------------|
| `model_presence` | key in `models` record | row exists |
| `enabled` | `enabled` | `enabled` |
| `context_window_size` | `limits.length` | `contextWindowSize` |
| `max_tokens` | `limits.maxOutput` | `maxOutputTokens` |
| `input_cost_per_token` | `cost.input` | `inputCostPerToken` |
| `output_cost_per_token` | `cost.output` | `outputCostPerToken` |

Legacy sync direction names map to Batch 3 names (see
[`sync-status.ts`](../services/model-proxy-registry-service/src/types/sync-status.ts)).

## API response shape (target)

```json
{
  "modelName": "my-alias",
  "status": "synced",
  "enabled": true,
  "modelRoute": {
    "modelName": "my-alias",
    "enabled": true,
    "inputCostPerToken": 0.000003,
    "outputCostPerToken": 0.000015,
    "contextWindowSize": 200000,
    "maxOutputTokens": 8192,
    "credentialName": "openai-main",
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
- Upstream resolver: [`services/model-proxy-service/src/resolver/upstream-provider.ts`](../services/model-proxy-service/src/resolver/upstream-provider.ts)
- Batch 3 plan: [`.cursor/plans/batch_3_implementation_plan_73d35577.plan.md`](../../.cursor/plans/batch_3_implementation_plan_73d35577.plan.md)
