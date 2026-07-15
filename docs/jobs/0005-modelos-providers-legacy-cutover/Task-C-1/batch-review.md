# Batch C review — Task-C-1

## Decision

**Changes requested.** `apps/web` now has no operational mutation: the static
scan found no `useMutation` or POST/PUT/PATCH/DELETE client operation outside
tests; the agents, models, provider, health-check, AA benchmark, and
OpenRouter-sync writers are removed. The remaining issue is a read regression
on the OpenRouter benchmark route.

## Findings

1. **[P1] `/benchmarks/openrouter` no longer preserves its supported read.**
   `apps/web/src/App.tsx:151` redirects that route to `/benchmarks/aa` instead
   of rendering the existing OpenRouter benchmark dataset. AA and OpenRouter
   are separate sources, so a direct link/bookmark to the OpenRouter route can
   no longer inspect its read data. Keep a read-only OpenRouter page (without
   sync controls) or replace the redirect with an explicit deprecation page
   that states the data's new read location, if the source is deliberately
   being retired.

## Verified positives

- Agents now list their catalog/category reads at both `/agents` and
  `/agents/:id`, with an `apps/ui` handoff; their create/update/delete UI and
  HTTP clients are deleted.
- `/models/configured`, `/models/providers`, `/models/health-check`, and
  `/benchmarks/aa` retain their reads and hide writers with `apps/ui` handoffs.
- Legacy model form/detail/alias modules, model writer client methods, and
  health/benchmark/OpenRouter mutation clients are deleted.
- Fresh focused suite passes: `pnpm --filter web exec vitest run
src/features/models/providers-page.read-only.test.tsx
src/features/models/models-health-check-page.read-only.test.tsx
src/features/benchmarks/benchmarks-page.read-only.test.tsx
src/pages/__tests__/models-gates.test.tsx
src/pages/__tests__/model-stats-gates.test.tsx` (6 tests).
- `pnpm --dir apps/web typecheck` and `git diff --check -- apps/web` pass.

## Required follow-up verification

Restore a read-only OpenRouter benchmark route, test it, and then re-run the
focused suite plus `pnpm --dir apps/web typecheck`.

## Scope clarification

The review scope was explicitly expanded to all of `apps/web`. The health
actions, AA sync mutation, OpenRouter sync mutation, and agent mutations are
now removed rather than merely hidden.
