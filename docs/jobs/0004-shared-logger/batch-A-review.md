# Independent review — Batch A / SPEC-0004

Date: 2026-07-13  
Cadence: `final_only` — first independent review of Batch A  
Scope: Task-A-1 and Task-A-2 only

## Review basis

Read the two task entries in `docs/jobs/0004-shared-logger/super-plan.json`,
the SPEC, both task reports, both review packages, and the owned files in the
working tree. The review was limited to the requested paths and did not run the
full repository suite. Focused verification:

```text
pnpm exec vitest run packages/logger/src/index.test.ts scripts/code-checks/check-console-log.test.ts
2 test files passed; 13 tests passed
```

The guard's two expected violation diagnostics were printed by its intentional
failure fixtures; the focused command exited successfully.

## Findings

### Important — Task-A-2: git failures fail open as a successful check

File: `scripts/code-checks/check-console-log.ts:84-100`

`stagedDiff()` catches every `git diff --cached` failure and returns an empty
string. The guard then reports success at line 183 and exits zero. A missing
repository, unavailable git executable, or another git error can therefore
bypass the pre-commit gate while appearing clean. This conflicts with the
guard's purpose and with the acceptance requirement that the guard return
non-zero when it cannot establish the staged state. The catch should surface the
error and set a non-zero exit, while the legitimate no-relevant-staged-files
case should remain a zero exit.

### Minor — Task-A-1: pretty/Chalk behavior is under-tested for the stated TDD contract

File: `packages/logger/src/index.test.ts:80-96`

The pretty test checks content and single-line output, but does not control time
or color support and does not assert the required color mapping or the no-ANSI
behavior when color is unsupported/redirection is present. The implementation
uses `new Chalk()` and the expected focused suite passes, so this is a coverage
gap rather than a demonstrated runtime failure. It leaves the SPEC's
"cores determinísticas" and terminal/no-ANSI edge case insufficiently protected
against regression.

## Spec compliance

### Task-A-1

- `createLogger({ consumer })`, public exports, runtime Chalk dependency, and
  workspace lockfile importer are present.
- JSON is the default and invalid values fall back to JSON; the four methods
  use the matching console destinations and include event, consumer, timestamp,
  and metadata.
- Pretty output is one line and applies the requested timestamp, level,
  consumer, and event styling through Chalk.
- The package files and lockfile stay within the declared Task-A-1 ownership.
- TDD evidence exists and the focused logger tests pass, but the reported RED
  phase only observed `No projects matched the filters` before the package
  existed; it is weaker evidence than a failing test suite against the intended
  contract. The Minor finding records the remaining test coverage gap.

### Task-A-2

- The guard parses staged JS/TS blobs with the TypeScript AST, considers only
  added lines, ignores comments/strings/removals, handles multiline calls, and
  applies the declared `packages/logger/**` and `**/scripts/**` exceptions.
- It reports file and start line, returns non-zero for detected violations, and
  leaves the worktree untouched in the reviewed path.
- `package.json` exposes `check:console-log`; `scripts/pre-commit` preserves
  both `docs-check` and `check-staged` and invokes the new gate between them.
- The focused guard tests pass, but the Important fail-open finding remains a
  robustness/compliance issue for git error handling.

## Strengths

- Ownership is disjoint between the two Batch A tasks in the reviewed files;
  no Task-A-2 change touches `packages/logger` or `apps/ui`.
- The AST approach avoids the common false positives from comments and string
  literals while preserving legacy calls outside added diff lines.
- The logger keeps the public API small, uses the requested four destinations,
  emits ISO timestamps at call time, and keeps pretty output single-line.
- The tests use temporary git repositories for staged-diff scenarios and do not
  mutate the user's worktree.

## Issues summary

| ID  | Task     | Severity  | Status                                                                   |
| --- | -------- | --------- | ------------------------------------------------------------------------ |
| A-1 | Task-A-2 | Important | Open: `git diff --cached` errors fail open.                              |
| A-2 | Task-A-1 | Minor     | Open: pretty/Chalk and no-ANSI edge cases lack deterministic assertions. |

## Assessment

Batch A is substantially compliant and the focused implementation/tests are
green, but it is not clean for final approval because Task-A-2 can silently
bypass the staged guard when git inspection fails. Task-A-1 has a smaller test
coverage deficiency around deterministic Chalk behavior. Recommended status:
`changes_requested` for the two open findings above; no ownership violation was
found.
