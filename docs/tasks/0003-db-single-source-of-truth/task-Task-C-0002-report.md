# Task-C-0002 Report: Clean root package.json scripts and references

## 1. What you implemented

Removed five scripts from root `package.json` that operated on `@settings/`:

- `settings:import` — `tsx scripts/src/settings-import/index.ts`
- `settings:export` — `tsx scripts/src/settings-export/index.ts`
- `generate:agents-schema` — `tsx scripts/src/generate-schema/index.ts`
- `validate:agents` — `tsx scripts/src/validate-agents/index.ts`
- `validate:agents:all` — `tsx scripts/src/validate-agents/index.ts --strict`

Verified that `turbo.json` and `pnpm-workspace.yaml` contain no references to these scripts (no changes needed).

## 2. What you tested and test results

- **`pnpm docs-check`**: passed with 0 errors, 0 warnings.

## 3. TDD Evidence

Not required by this task (no new code, only deletion).

## 4. Files changed

| Change   | File                          |
|----------|-------------------------------|
| Modified | `package.json`                |

## 5. Self-review findings

- The `sync:aa-benchmarks` script was preserved (it is unrelated to `@settings`).
- `turbo.json` had no pipeline entries referencing the deleted scripts — confirmed via grep.
- `pnpm-workspace.yaml` had no references — confirmed via grep.
- The `repositories/agents-repository/package.json` still has `validate:agents` and `validate:plugins` echo stubs (left by Task-B-0002). These are not root scripts and are out of scope for this task.

## 6. Issues or concerns

None.
