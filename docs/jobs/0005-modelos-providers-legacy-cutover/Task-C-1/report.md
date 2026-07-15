# Task-C-1 report

## Result

`apps/web` retains read-only model and provider lists. The former provider
forms, credential/OAuth controls, discovery/testing/registration actions, and
provider API client writers are removed. The exposed model pages have no
create, update, delete, or sync controls and direct administrators to
`apps/ui`. Health-check and benchmark routes now retain their reads while
removing health-check, benchmark-sync, and alias writers. The legacy model
forms, settings/alias screens, writer hooks, and associated API client methods
have been deleted rather than merely unmounted. Model Statistics also no
longer exposes its log-deletion control.

## RED evidence

Added `providers-page.read-only.test.tsx`; before the implementation it failed
because `ProvidersPage` attempted to render the legacy OAuth mutation surface
(`openAiOAuthConnection` was required by the old page).

## GREEN evidence

- `pnpm --filter web exec vitest run src/features/models/providers-page.read-only.test.tsx src/features/models/models-health-check-page.read-only.test.tsx src/features/benchmarks/benchmarks-page.read-only.test.tsx src/pages/__tests__/models-gates.test.tsx src/pages/__tests__/model-stats-gates.test.tsx` — 6 tests passed.
- `pnpm --dir apps/web typecheck` — passed.
- `pnpm --dir apps/web build` — passed.
- Targeted mutation/writer scan of the Task-C-1 hooks, page, and provider API
  client returned no matches for provider create/update/delete, OAuth start,
  registration, form credential state, or `useMutation`.
- `git diff --check` — passed.

## Concerns

Read-only detail/dashboard helper files remain where they do not expose a
writer. The legacy settings route, forms, alias screen, and writer hooks were
deleted with their client methods.
