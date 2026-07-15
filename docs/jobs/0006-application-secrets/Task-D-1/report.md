Process: `super-planning` — Task-D-1 final integration.

## Focused verification

- Schema contract: 4/4 passed.
- Application secrets service: 6/6 passed.
- UI/handler/query tests: 12/12 passed.
- Benchmark sync services and compatibility routes: 14/14 passed.
- `pnpm typecheck` passed across all 18 packages.
- `scripts/docs-check --emit-index` generated the index and reported 13 docs,
  0 errors, 0 warnings.
- Scoped search over `packages/config/src`, `apps/server/src/runtime`, and
  `.env.example` found no removed API-key environment contracts.

## Global baseline conditions

- `pnpm verify -c` still fails after docs-check because code-checks reports 13
  workspace export sets with no consumers. This was observed before the
  feature and was explicitly acknowledged before implementation.
- `pnpm test` was run both normally and with Turbo `--env-mode=loose`. The
  latter reaches the suite but fails outside this feature: 12 invite tests
  require `TEST_DATABASE_URL`, and two existing UI shell/sidebar expectations
  fail. No application-secret focused test fails.

## Handoff

The migration is `database/drizzle/0003_application-secrets-store.sql` and is
additive only. Before release, an administrator must save real keys in a
controlled environment, trigger both syncs, inspect UI/log output for secret
exposure, and deploy with the migration applied before application code.

Plan closure awaits explicit approval to proceed with the documented external
global-suite failures.

## Approved baseline and final remediation

The user approved proceeding with the documented global baselines. Final audit
findings were remediated: APP_ENCRYPTION_KEY is optional at startup and still
fails closed at secret use; secret removal requires AlertDialog confirmation;
and the protected navigation exposes `/models/secrets`. The secrets component
test (3/3), UI typecheck, server typecheck, diff check, docs index generation,
and scoped environment search passed after the remediation.
