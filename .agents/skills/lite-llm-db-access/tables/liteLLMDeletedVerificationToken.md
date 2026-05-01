# Table: LiteLLM_DeletedVerificationToken

> **Note:** This is a cached reference. Data changes frequently in the live database. Always run a query if exact real-time precision is needed.

## Schema Sketch

- `id`: text (PK, not null)
- `token`: text (not null) - hash of deleted proxy API key
- `keyAlias` -> `key_alias`: text (nullable)
- `deletedAt` -> `deleted_at`: timestamp(3) (not null, default current_timestamp)
- `deletedBy` -> `deleted_by`: text (nullable)
- `expires`: timestamp(3) (nullable)
- `blocked`: boolean (nullable)
- `createdAt` -> `created_at`: timestamp(3) (nullable)

## Example Record

```json
{
  "token": "9217285f39094d88949aa3491a0a21dc9c72e754487d0b2c6b6585f6eb84cfc3",
  "key_alias": "debug-local-2026-04-30",
  "deleted_at": "2026-04-30T21:36:13.701",
  "expires": "2026-05-30T21:32:25.471",
  "blocked": null,
  "deleted_by": "default_user_id",
  "created_at": "2026-04-30T21:32:25.476"
}
```
