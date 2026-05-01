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
  "credential_id": "fc30c8b5-b411-4bc0-9869-617e7aba9e88",
  "credential_name": "ATplus Router",
  "credential_values": {
    "api_key": "1q3WqsREYQ50uN1NTB3utYrHhs1mfAprZetVMe14WeVkCmTVWo38_nyYVvD2L8oMlQW6-_EhaYcMsg6hJW3ZX-8=",
    "api_base": "g6vpYKOm0RkWJo_wCmkeOUCF6LEzPjmb4ud4PqMXBEMMxg10G3DFiYy6p3A7jGo49zKphl75o66ruWchu1eVP3c="
  },
  "credential_info": {
    "custom_llm_provider": "litellm_proxy"
  },
  "created_at": "2026-04-30T23:37:45.588",
  "created_by": "default_user_id",
  "updated_at": "2026-04-30T23:37:45.588",
  "updated_by": "default_user_id"
}
```
