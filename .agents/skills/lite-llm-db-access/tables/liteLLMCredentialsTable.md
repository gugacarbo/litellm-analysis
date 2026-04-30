# Table: LiteLLM_CredentialsTable

> **Note:** This is a cached reference. Data changes frequently in the live database. Always run a query if exact real-time precision is needed.

## Schema Sketch

- `credentialId` -> `credential_id`: text (PK, not null)
- `credentialName` -> `credential_name`: text (unique, not null)
- `credentialValues` -> `credential_values`: jsonb (not null)
- `credentialInfo` -> `credential_info`: jsonb (nullable)
- `createdAt` -> `created_at`: timestamp(3) (not null, default current_timestamp)
- `createdBy` -> `created_by`: text (not null)
- `updatedAt` -> `updated_at`: timestamp(3) (not null, default current_timestamp)
- `updatedBy` -> `updated_by`: text (not null)

## Example Record

```json
{
  "credential_id": "422950f9-021b-4b3d-88c9-a6f9697e1fd4",
  "credential_name": "MAIN CREDENTIALS",
  "credential_info": {
    "custom_llm_provider": "OPENAI_LIKE"
  },
  "created_at": "2026-04-30T21:32:59.72",
  "created_by": "default_user_id",
  "updated_at": "2026-04-30T21:32:59.72",
  "updated_by": "default_user_id"
}
```
