# Table: LiteLLM_ProxyModelTable

> **Note:** This is a cached reference. Data changes frequently in the live database. Always run a query if exact real-time precision is needed.

## Schema Sketch

- `modelId` -> `model_id`: text (PK, not null)
- `modelName` -> `model_name`: text (not null)
- `litellmParams` -> `litellm_params`: jsonb (not null)
- `modelInfo` -> `model_info`: jsonb (nullable)
- `createdAt` -> `created_at`: timestamp(3) (not null, default current_timestamp)
- `createdBy` -> `created_by`: text (not null)
- `updatedAt` -> `updated_at`: timestamp(3) (not null, default current_timestamp)
- `updatedBy` -> `updated_by`: text (not null)

## Example Record

```json
{
  "model_id": "782c2c53-bfb5-4e83-a19a-aecdbfb52570",
  "model_name": "deepseek-v4-pro",
  "litellm_params": {
    "model": "deepseek-v4-pro",
    "max_tokens": 384000,
    "model_name": "deepseek-v4-pro",
    "use_litellm_proxy": false,
    "context_window_size": 1048576,
    "custom_llm_provider": "B0KtWZZNH6VeXo19TL2PNdaN_15hO7TVi8sfdUaIF3YkBjmkn2vj8VfEYc-8KcRk4EU8YPQ=",
    "use_in_pass_through": false,
    "input_cost_per_token": 0.00000174,
    "output_cost_per_token": 0.00000348,
    "litellm_credential_name": "l8mI-vhvZBgLEv28_Cn95XNVkprUa1NzHfFtvOZGxPl3CswzBbkzlF7wZ7X2_bIHScLt0_gR7UyGi9ATxmGT",
    "merge_reasoning_content_in_choices": false
  },
  "model_info": {
    "id": "782c2c53-bfb5-4e83-a19a-aecdbfb52570",
    "db_model": true,
    "access_groups": []
  },
  "created_at": "2026-04-27T21:18:03.292",
  "created_by": "lite-llm-analytics",
  "updated_at": "2026-04-30T21:45:53.955",
  "updated_by": "codex-cli"
}
```
