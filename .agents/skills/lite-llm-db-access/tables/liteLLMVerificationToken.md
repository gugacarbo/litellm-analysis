# Table: LiteLLM_VerificationToken

> **Note:** This is a cached reference. Data changes frequently in the live database. Always run a query if exact real-time precision is needed.

## Schema Sketch

- `token`: text (PK, not null) - hash of the proxy API key
- `keyAlias` -> `key_alias`: text (nullable)
- `expires`: timestamp(3) (nullable)
- `blocked`: boolean (nullable)
- `createdAt` -> `created_at`: timestamp(3) (default current_timestamp)
- `createdBy` -> `created_by`: text (nullable)
- `updatedBy` -> `updated_by`: text (nullable)

## Example Record

```json
{
  "token": "b45ce87956ad9bdca9de904f5597d3d5c857767d03b2ec6f0fcbb3c83292d8cb",
  "key_alias": "permanent-access-2026-04-30",
  "created_at": "2026-04-30T23:35:15.994",
  "expires": null,
  "blocked": null,
  "created_by": "default_user_id",
  "updated_by": "default_user_id"
}
```
