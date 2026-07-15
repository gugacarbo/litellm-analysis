Process: `super-planning` — Task-C-1 admin surface.

## Summary

- Added admin-only server functions and handlers to list public secret status
  and replace or remove either fixed application secret.
- Both authorization failures occur before the secret service is constructed;
  public schemas are strict and never include plaintext or encryption-envelope
  fields.
- Added the `/models/secrets` route, metadata-only status cards, password
  input for replacement, and remove action. The form uses React Hook Form with
  the Zod replacement schema; the entered value is cleared and unmounted after
  a successful save.

## TDD evidence

- RED: in an isolated detached worktree at `c22e434a`, the new page test
  failed before any tests could run because `./secrets-page` did not exist.
  Command: `pnpm --filter ui exec vitest run
src/features/model-admin/secrets/secrets-page.test.tsx`.

  Captured RED output:

  ```text
  Test Files  1 failed (1)
       Tests  no tests
  FAIL  src/features/model-admin/secrets/secrets-page.test.tsx
  Error: Failed to resolve import "./secrets-page" from
  "src/features/model-admin/secrets/secrets-page.test.tsx". Does the file exist?
  ```

- GREEN:
  `pnpm --filter ui exec vitest run src/features/model-admin/secrets/secrets-page.test.tsx src/features/model-admin/server/application-secrets.handlers.test.ts src/features/model-admin/query/query-options.test.ts`
  passed: 3 files, 12 tests.
- `pnpm --filter ui typecheck` passed.

## Security checks

- Unauthenticated and viewer requests are rejected before service resolution.
- Serialized handler results are tested not to contain plaintext or envelope
  fields.
- Browser query/mutation contracts use public metadata only.
