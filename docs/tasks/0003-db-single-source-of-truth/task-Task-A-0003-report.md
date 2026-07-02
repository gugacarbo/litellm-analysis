# Task-A-0003 Report: Remove SETTINGS_PATH from server environment

**Status:** BLOCKED

## What I implemented

Removed `SETTINGS_PATH` from three files:

1. **`packages/config/src/server.ts`** — Removed the `SETTINGS_PATH: z.string().default("@settings")` line from the `serverSchema` object.
2. **`.env.example`** — Removed the `# ── Settings Paths ──` comment and `SETTINGS_PATH=@settings` line.
3. **`.env.local`** — Removed the `# ── Settings Paths ──` comment and `SETTINGS_PATH=@settings` line.

## What I tested

Ran `npm run typecheck` across the entire workspace.

## TDD Evidence

Not required for this task.

## Files changed

- **Modified:** `packages/config/src/server.ts`
- **Modified:** `.env.example`
- **Modified:** `.env.local`

## Self-review findings

All three edits are clean and minimal. No dead code left behind.

## Issues or concerns

**BLOCKED** — `npm run typecheck` fails with:

```
@lite-llm/agents-repository:typecheck: src/schemas/__tests__/validate-json-schema.test.ts:83:15 - error TS2339: Property 'SETTINGS_PATH' does not exist on type 'Readonly<{ ... }>'.
@lite-llm/agents-repository:typecheck: 83     serverEnv.SETTINGS_PATH,
```

The file `repositories/agents-repository/src/schemas/__tests__/validate-json-schema.test.ts` still references `serverEnv.SETTINGS_PATH`. This file is outside Task-A-0003's `filesTouched` — it belongs to **Task-B-0002** (batch B), which is supposed to delete or update that test file.

Since Task-A-0003's acceptance criteria require `npm run typecheck` to pass, and the only remaining reference is in a file owned by a later task, this task cannot complete until Task-B-0002 is done, or the scope of Task-A-0003 is expanded to include that file.
