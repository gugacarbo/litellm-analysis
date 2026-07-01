# Task-C-0002 Report

## Summary

Added a global manual aliases page under the models area at `/models/aliases`,
kept it in the existing models UI language, wired sidebar navigation under the
models section, and backed the page with the approved alias API client so
operators can search aliases, filter by target model, and remove aliases from a
single table. On review `try 2`, added the focused web page test coverage for
route resolution and concrete aliases-page behavior, and added an explicit
`aria-label` for the icon-only delete action.

## Changed Files

- `apps/web/src/features/models/models-aliases-page.tsx`
- `apps/web/src/pages/__tests__/models-aliases-page.test.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/shared/components/layout/sidebar.tsx`
- `docs/tasks/0001-manual-model-routing-aliases/task-Task-C-0002-report.md`
- `docs/tasks/0001-manual-model-routing-aliases/progress.log`

## Requirements Coverage

- Added the new global aliases route at `/models/aliases` in the models route
  tree, ahead of the dynamic `:modelName` route.
- Added a models-sidebar entry for `Aliases` without moving alias management
  into plugins.
- Built a dedicated models-area page that calls `getAllModelAliases()` and
  renders the flat `{ alias, targetModel }` list.
- Derived target-model filter options directly from the alias payload, without
  fetching a second dataset.
- Added alias search by alias name and filtering by target model.
- Added clearly labeled alias removal with confirmation and post-delete query
  invalidation for the shared `["model-aliases"]` query family so list and
  model-detail alias views stay consistent after deletion.
- Added an explicit accessible name on the icon-only remove button:
  `aria-label="Remove alias <alias>"`.
- Added focused UI verification in
  `apps/web/src/pages/__tests__/models-aliases-page.test.tsx` covering the
  real `/models/aliases` route resolution through `App`, alias search, target
  filtering, and remove-action wiring plus post-delete refresh behavior.

## Verification

- `rtk proxy pnpm exec biome format --write apps/web/src/features/models/models-aliases-page.tsx apps/web/src/App.tsx apps/web/src/shared/components/layout/sidebar.tsx`
- `rtk proxy pnpm exec biome format --write apps/web/src/features/models/models-aliases-page.tsx apps/web/src/pages/__tests__/models-aliases-page.test.tsx docs/tasks/0001-manual-model-routing-aliases/task-Task-C-0002-report.md`
- `rtk proxy pnpm --filter web test -- models-aliases-page`
- `rtk proxy pnpm --filter web test -- aliases`

## Notes

- `rtk proxy pnpm --filter @lite-llm/web typecheck` and
  `rtk proxy pnpm --filter web typecheck` could not complete cleanly because of
  a pre-existing out-of-scope error in
  `apps/web/src/features/models/detail/model-detail-settings-tab.tsx`, where
  `ModelConfigForm` is already being called without the new
  `aliases`/`aliasesLoading`/`onAliasesChange` props introduced by
  `Task-C-0001`.
- Stayed within the task’s allowed implementation files plus the required task
  report, progress log, and the expanded review-approved test file.
