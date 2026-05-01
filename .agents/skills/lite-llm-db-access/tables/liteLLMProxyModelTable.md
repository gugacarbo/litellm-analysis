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
  "model_id": "c386542b-2705-4ed7-ad9d-2854815e6f57",
  "model_name": "glm-5-turbo",
  "litellm_params": {
    "model": "glm-5-turbo",
    "max_tokens": 128000,
    "model_name": "glm-5-turbo",
    "use_litellm_proxy": false,
    "context_window_size": 200000,
    "custom_llm_provider": "litellm_proxy",
    "use_in_pass_through": false,
    "input_cost_per_token": 0.0000012,
    "output_cost_per_token": 0.000004,
    "litellm_credential_name": "ATplus Router",
    "merge_reasoning_content_in_choices": false
  },
  "model_info": {
    "id": "c386542b-2705-4ed7-ad9d-2854815e6f57",
    "db_model": true,
    "access_groups": [],
    "direct_access": true,
    "access_via_team_ids": [],
    "input_cost_per_token": 0.0000012,
    "output_cost_per_token": 0.000004
  },
  "created_at": "2026-03-30T22:47:32.136",
  "created_by": "default_user_id",
  "updated_at": "2026-04-30T21:44:47.266",
  "updated_by": "default_user_id"
}
```
