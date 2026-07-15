Process: `super-planning` — Task-B-1 runtime integration.

## Summary

- Removed `ARTIFICIAL_ANALYSIS_API_KEY` and `OPENROUTER_API_KEY` from the
  server environment schema, example environment file, runtime construction,
  and local-infrastructure guidance.
- Both benchmark services now resolve the corresponding allowlisted database
  secret for each trigger. An absent, corrupt, or undecryptable value produces
  the existing public missing-key error code and does not invoke the runner.
- Runner failures redact the resolved key before it reaches sync status or a
  route response. Trigger resolution is included in the duplicate-trigger
  guard.

## TDD evidence

- RED: in an isolated detached worktree at `c22e434a`, the new focused sync
  suite failed 11 of 12 tests because the base services only accepted static
  environment-backed key fields and could not satisfy resolver-per-trigger
  behavior. Command:
  `APP_ENCRYPTION_KEY=<test-key> PORT=3000 DATABASE_URL=<test-url> pnpm --filter server exec vitest run src/__tests__/benchmark-sync-application-service.test.ts src/__tests__/openrouter-benchmark-sync-application-service.test.ts`.

  Captured RED output:

  ```text
  Test Files  2 failed (2)
       Tests  11 failed | 1 passed (12)
  FAIL ... BenchmarkSyncApplicationService > starts a background run and dedupes concurrent triggers
  Error: ARTIFICIAL_ANALYSIS_API_KEY is not configured
  FAIL ... OpenRouterBenchmarkSyncApplicationService > resolves the key at every trigger
  Error: OPENROUTER_API_KEY is not configured
  ```

- GREEN:
  `APP_ENCRYPTION_KEY=<test-key> PORT=3000 DATABASE_URL=<test-url> pnpm --filter server exec vitest run src/__tests__/benchmark-sync-application-service.test.ts src/__tests__/openrouter-benchmark-sync-application-service.test.ts`
  passed: 3 files, 14 tests, including route regressions that verify both
  asynchronous configuration exceptions remain mapped to the existing public
  `*_API_KEY_MISSING` codes.
- `pnpm --filter server typecheck` passed.

## Notes

The focused tests require the workspace's mandatory environment contract even
though they do not connect to a database. Test-only values were supplied; no
real credential was read or logged.
