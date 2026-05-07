---
name: commit-changes
description: Create git commits based on current changes. Use this skill whenever you need to commit changes, create a commit message, stage files, or when the user mentions git commit, staging, or committing code. Automatically analyzes git diff, groups related changes, generates Conventional Commits messages, proposes atomic commits, and detects AGENTS.md updates from diff signals. ALWAYS run git status and git diff first. Unless the user explicitly passes --yes / -y / --auto-approve, ALWAYS show proposed commit message(s) and ask for confirmation before executing git commit. When a file path or directory is provided, scope the commit to only those paths. ALWAYS scan diffs for AGENTS.md-relevant information (new commands, features, types, patterns) and propose documentation updates.
compatibility: Requires git CLI, bash tool
---

# Commit Changes Skill

This skill helps you create well-structured git commits based on your current uncommitted changes, and keeps AGENTS.md documentation in sync with code changes.

## When to Use

- User asks to "commit changes", "create a commit", "git commit"
- User wants to commit but needs help with the message
- You have staged/unstaged changes and need to organize them
- User wants to follow Conventional Commits format
- After completing work that added new commands, features, types, or patterns that should be documented in AGENTS.md

## Auto-Approve and Path Scoping

This skill supports two important shortcuts that change the default behavior:

### Auto-Approve Mode (Skip Confirmation)

When the user includes any of these flags in their request, **skip the confirmation prompt and commit immediately** after showing the proposed commit message:

- `--yes` or `-y`
- `--auto-approve` or `--auto`
- `--no-confirm`
- Portuguese equivalents: `--sim`, `--auto-aprovar`, `--sem-confirmar`

When auto-approve is active:
1. Still run `git status` and `git diff` to analyze changes
2. Still compute the proposed commit message and show it
3. Still detect AGENTS.md update needs and propose them
4. **Do not** ask for confirmation — just execute the commit(s)
5. If AGENTS.md updates are detected, apply them automatically as well (in the same commit, amending if needed)

**Important nuance:** If there are multiple unrelated groups of changes, auto-approve still commits them all as a single atomic commit (not split). Only the confirmation step is skipped — you still analyze and structure the commit properly.

### Path/File Scoping

When the user provides a file path or directory in their request, **scope the commit to only those paths**. For example:

- `commit src/auth/` → only changes under `src/auth/`
- `commit --yes package.json` → auto-approve, only `package.json`
- `commit my changes but only the api folder` → scope to `api/`

**How to handle path scoping:**

1. Parse the user's request to extract the path(s) they want to commit
2. When running `git diff`, use the path to filter: `git diff HEAD -- <path>`
3. When staging files, use: `git add <path1> <path2> ...`
4. When analyzing changes, only consider files matching the scoped path(s)
5. If a path doesn't exist or has no changes, tell the user and stop
6. If using `git diff HEAD` (full repo diff), also check if the scoped path has any changes before proceeding

**Combined with auto-approve:** `commit --yes src/modules/auth/` → scoped to `src/modules/auth/`, no confirmation.

## Workflow

### Step 0: Parse User Intent

Before the standard workflow, extract any flags or paths from the user's request:

```
User says:  "commit --yes src/auth/"
Extract:    auto_approve = true, scope_paths = ["src/auth/"]

User says:  "commit my changes"
Extract:    auto_approve = false, scope_paths = null

User says:  "commit -y package.json README.md"
Extract:    auto_approve = true, scope_paths = ["package.json", "README.md"]

User says:  "commit only src/api/routes.ts"
Extract:    auto_approve = false, scope_paths = ["src/api/routes.ts"]

User says:  "commita minhas mudanças --sim src/server/"
Extract:    auto_approve = true, scope_paths = ["src/server/"]
```

**Flag parsing rules:**
- Flags can appear anywhere in the user's message (beginning, middle, end)
- Flags are case-insensitive: `--YES`, `--Yes`, `-Y` all work
- Portuguese equivalents are recognized alongside English ones
- Remove the flags from your analysis — treat the rest of the message as the commit context

**Path parsing rules:**
- Paths can be relative to repo root: `src/auth/login.ts`, `./src/auth/`, `packages/`
- Paths can appear anywhere in the user's message
- Multiple paths are supported: `commit src/auth/ tests/auth/`
- If path doesn't exist, warn the user and suggest checking the path
- If path exists but has no changes, tell the user: "No changes found in `<path>`"

### Step 1: Analyze Current State

**ALWAYS start by running:**

```bash
git status --short
git diff HEAD -- <scope_paths>
```

If `scope_paths` is set, pass them to both commands:
```bash
git status --short -- <scope_paths>
git diff HEAD -- <scope_paths>
```

This tells you:
- Which files are modified, added, or deleted
- What changes were made (the actual diff)
- Whether files are staged or unstaged

### Step 1b: Validate Scoped Paths

If the user provided path(s):

1. Check each path exists: `ls -d <path> 2>/dev/null`
2. Check each path has changes: `git status --short -- <path>`
3. If a path doesn't exist, respond: `Path "<path>" does not exist. Did you mean one of these?` and suggest close matches
4. If a path has no changes, respond: `No changes found in "<path>". Nothing to commit.`

### Step 2: Detect AGENTS.md Update Needs

**IMPORTANT:** Before grouping changes, scan the diff for information that should propagate to AGENTS.md files. This is a critical step — stale AGENTS.md files cause agents to make wrong decisions.

#### When to propose AGENTS.md updates:

| Diff Change | AGENTS.md Section to Update |
|------------|---------------------------|
| New `package.json` script | `Commands` table |
| New feature folder (e.g., `src/features/X/`) | `scope-index` (nearest AGENTS.md) |
| New golden sample pattern | `Golden Samples` table |
| New heuristic or rule | `Heuristics` table |
| New command in Makefile/package.json | `Commands` table |
| New generated type from NocoBase/IXC | `Generated Types` table |
| New CI/CD workflow | `CI/Quality Gates` |
| New file map entry | `File Map` |
| Changes to AGENTS.md itself | `Codebase State` (if deprecated info) |
| New env variable in `.env.example` | `Heuristics` table |
| New dependency added/removed | `Heuristics` table (or Boundaries note) |
| New route added in `src/routes/` | `Golden Samples` table |
| New collection/schema in NocoBase | `Generated Types` table |
| `@deprecated` annotations added | `Codebase State` |
| New hook in `src/hooks/` | `Heuristics` table (if it becomes a standard) |
| New utility in `src/lib/` | `Heuristics` table (if it becomes a standard) |
| New repository/service in `src/repositories/` | `Golden Samples` or `Heuristics` |
| Barrel export (`index.ts`) added/removed | `Boundaries` → `Never Do` (barrel export rules) |
| New component in `src/components/` | `Golden Samples` (if it establishes a pattern) |
| New skill mapping added | `Skill Mappings` section |

#### How to detect:

- **New commands**: Look for `package.json` changes with new scripts, or Makefile changes. Check both `scripts:` block and any new Makefile targets.
- **New feature folders**: Look for new directories under `src/features/*/`, `src/components/*/`, `src/hooks/*/`, `src/lib/*/`, `src/repositories/*/`
- **Golden samples**: Look for new reference files that establish patterns (e.g., new route structure, new component architecture, new hook pattern)
- **Generated types**: Look for changes in `src/generated/` or new NocoBase/IXC collections referenced in code
- **Deprecated code**: Search diffs for `@deprecated` JSDoc annotations or `// DEPRECATED` comments
- **Env vars**: Look for `.env.example` or `.env` changes
- **Dependencies**: Look for `package.json` `dependencies` or `devDependencies` additions/removals
- **Route changes**: Look for new files in `src/routes/` or changes to `src/routes/router.tsx`
- **Skill mappings**: Look for new `.agents/skills/` directories or changes to skill intent mappings

#### Nearest-file resolution:

When proposing AGENTS.md updates, **always target the nearest AGENTS.md** to the changed files, not just the root:

| Changed file path | Target AGENTS.md |
|---|---|
| `src/features/cs/negociacoes/*.tsx` | `src/features/cs/negociacoes/AGENTS.md` |
| `src/features/cs/*.tsx` | `src/features/cs/AGENTS.md` |
| `src/components/ui/button.tsx` | `src/components/AGENTS.md` |
| `src/hooks/use-auth.ts` | `src/hooks/AGENTS.md` |
| `src/lib/format.ts` | `src/lib/AGENTS.md` |
| `src/repositories/nocobase/*.ts` | `src/repositories/AGENTS.md` |
| `package.json`, root configs | Root `AGENTS.md` |
| `.github/workflows/*.yml` | `.github/workflows/AGENTS.md` |

If the nearest directory has no AGENTS.md, propose creating one (use `feature-agents-md` skill).

#### Propose AGENTS.md updates alongside commits:

```
## Detected AGENTS.md Updates

Based on the diff, I recommend these AGENTS.md updates:

**1. Root AGENTS.md — Commands table**
- Added: `pnpm new-command` — description

**2. src/features/new-feature/AGENTS.md — New file created**
- Suggest creating AGENTS.md for this new feature

**3. src/features/AGENTS.md — scope-index**
- Add entry: `./src/features/new-feature/AGENTS.md` — description

Proceed with commit AND AGENTS.md updates? (yes / commit only / skip)
```

**When auto-approve is active, skip this prompt and auto-apply AGENTS.md updates.**

### Step 2b: How to Update AGENTS.md Files

When the user confirms AGENTS.md updates, follow these rules to make precise, safe edits.

#### Respect AGENTS-GENERATED markers:

AGENTS.md files use comment markers to delimit auto-generated sections:

```html
<!-- AGENTS-GENERATED:START commands -->
...content...
<!-- AGENTS-GENERATED:END commands -->
```

**Rules:**
- **ALWAYS** update content **between** the START/END markers, never outside them
- **NEVER** remove or rename markers
- **NEVER** add content before START or after END markers for that section
- If a section doesn't exist yet, add it with proper markers
- The `<!-- AGENTS-GENERATED: -->` markers are structural — treat them like HTML tags that must stay intact

#### Update the "Last updated" timestamp:

Every AGENTS.md has a comment at the top:
```html
<!-- Last updated: 2026-04-23 | Last verified: 2026-04-23 -->
```

**ALWAYS** update the `Last updated` date to today's date when making any edit. This lets agents know how fresh the file is.

#### Updating specific sections:

**Commands table** — Add/modify rows between the markers:
```markdown
<!-- AGENTS-GENERATED:START commands -->

| Task              | Command          | ~Time |
| ----------------- | ---------------- | ----- |
| Existing command  | `pnpm existing`  | ~10s  |
| New command       | `pnpm new-cmd`   | ~5s   |

<!-- AGENTS-GENERATED:END commands -->
```

**Golden Samples table** — Add new reference patterns:
```markdown
<!-- AGENTS-GENERATED:START golden-samples -->

| For           | Reference                        | Key patterns              |
| ------------- | -------------------------------- | ------------------------- |
| New pattern   | `src/path/to/file.tsx`           | Description of pattern    |

<!-- AGENTS-GENERATED:END golden-samples -->
```

**Heuristics table** — Add new decision rules:
```markdown
<!-- AGENTS-GENERATED:START heuristics -->

| When               | Do                              |
| ------------------ | ------------------------------- |
| New scenario       | Recommended action              |

<!-- AGENTS-GENERATED:END heuristics -->
```

**scope-index** — Add new scoped AGENTS.md entries:
```markdown
<!-- AGENTS-GENERATED:START scope-index -->

- `./src/features/new-feature/AGENTS.md` — Description of the feature

<!-- AGENTS-GENERATED:END scope-index -->
```

**Generated Types table** — Add new collection types:
```markdown
| NocoBase `t_new_collection` | `NewCollection` | `#/generated/nocobase/new-collection` |
```

**Codebase State** — Add notes about deprecated code, known issues:
```markdown
<!-- AGENTS-GENERATED:START codebase-state -->

- Contains deprecated code (grep for @deprecated)
- `src/legacy/module.ts` — scheduled for removal in v2.0

<!-- AGENTS-GENERATED:END codebase-state -->
```

**Skill Mappings** — Add new skill intent triggers:
```markdown
<!-- intent-skills:start -->

- { task: "New task description", load: ".agents/skills/new-skill/SKILL.md" }

<!-- intent-skills:end -->
```

#### When creating a new AGENTS.md for a feature folder:

1. Use the `feature-agents-md` skill if available
2. If not, create a minimal AGENTS.md with:
   - Feature name and purpose
   - Key files and their roles
   - Any feature-specific conventions
   - Proper markers for generated sections
   - A "Last updated" timestamp

#### File editing workflow:

1. **Read** the target AGENTS.md first (don't guess its contents)
2. **Identify** the correct section via markers
3. **Edit** only the content between markers
4. **Update** the "Last updated" timestamp
5. **Verify** the edit didn't break marker structure
6. **Stage** the AGENTS.md file alongside the commit

### Step 3: Group Related Changes

Analyze the changes and group them by logical concern:

**Same commit** - changes that belong together:
- Multiple files in the same feature/module
- Related refactoring (e.g., rename a function + update all callers)
- Test + implementation for the same feature

**Separate commits** - changes that should be split:
- Unrelated features (e.g., auth fix + UI styling)
- Bugfix + new feature
- Refactoring + functional changes

**Example grouping:**
```
src/modules/auth/login.tsx     → auth feature
src/modules/auth/hooks.ts      → auth feature
src/components/button.css      → UI styling (separate)
tests/auth.test.ts             → auth feature
```

### Step 4: Generate Commit Message(s)

Use **Conventional Commits** format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Type Selection

| Type | When to use |
|------|-------------|
| `feat` | New feature, new functionality |
| `fix` | Bug fix, fixing broken behavior |
| `refactor` | Code restructuring without behavior change |
| `docs` | Documentation only changes |
| `style` | Formatting, styling (no logic change) |
| `test` | Adding or updating tests |
| `chore` | Maintenance, config, dependencies |
| `perf` | Performance improvements |

#### Scope Inference

Infer scope from file paths:
- `src/modules/auth/*` → `auth`
- `src/components/*` → `ui` or component name
- `src/api/*` → `api`
- `*.md`, `docs/*` → `docs`
- `package.json`, configs → `deps` or `config`

#### Description Guidelines

- Use imperative mood: "add", "fix", "update" (not "added", "fixed")
- Be specific but concise
- No period at the end
- Max 72 characters

**Good examples:**
```
feat(auth): implement JWT token refresh
fix(api): handle 401 response in user service
refactor(ui): extract button variants to base component
docs: update API authentication examples
```

**Bad examples:**
```
fix: stuff
feat(auth): Added new stuff and fixed things
fix(auth): fixed the bug with login
```

### Step 5: Propose and Confirm (or Auto-Approve)

**If auto-approve is NOT active:** Show the proposal and ask for confirmation.

**If auto-approve IS active:** Show the proposal and immediately execute.

#### Presentation format for manual confirmation:

```
## Proposed Commit

**Files to stage:**
- src/modules/auth/login.tsx
- src/modules/auth/hooks.ts
- tests/auth.test.ts

**Commit message:**
```
feat(auth): implement JWT token refresh

Add automatic token refresh on 401 responses.
Refresh token is stored in httpOnly cookie.
```

**Detected AGENTS.md updates:**
- `AGENTS.md` — Update `Commands` table (new script: `pnpm auth:token-refresh`)
- `src/features/auth/AGENTS.md` — Update `scope-index` with new files

Proceed with commit AND AGENTS.md updates? (yes / commit only / skip)
```

#### Presentation format for auto-approve:

```
## Auto-approved Commit

**Files to stage:**
- src/modules/auth/login.tsx
- src/modules/auth/hooks.ts
- tests/auth.test.ts

**Commit message:**
```
feat(auth): implement JWT token refresh

Add automatic token refresh on 401 responses.
Refresh token is stored in httpOnly cookie.
```

**Auto-applied AGENTS.md updates:**
- `AGENTS.md` — Update `Commands` table (new script: `pnpm auth:token-refresh`)
- `src/features/auth/AGENTS.md` — Update `scope-index` with new files

Executing commit now...
```

**If multiple commits needed (manual mode only):**

```
## Proposed Commits (3)

### Commit 1/3
**Files:** src/modules/auth/*, tests/auth.test.ts
**Message:** feat(auth): implement JWT token refresh

### Commit 2/3
**Files:** src/components/button.css
**Message:** style(ui): update button hover states

### Commit 3/3
**Files:** README.md, AGENTS.md
**Message:** docs: add authentication setup guide

**Detected AGENTS.md updates:**
- Root `AGENTS.md` — Update `Commands` table
- Root `AGENTS.md` — Update `scope-index`

Proceed with all commits AND AGENTS.md updates? (yes / commits only / skip)
```

**Note on auto-approve + multiple groups:** When auto-approve is active and unrelated changes exist, commit them as a single atomic commit rather than splitting. Auto-approve is about speed — splitting into separate commits requires user judgment that auto-approve intentionally skips.

### Step 6: Execute Commit AND AGENTS.md Updates

After user confirms (or immediately if auto-approve):

```bash
# Stage files (with optional path scoping)
git add <files> <scope_paths>

# Optional: run quality checks
pnpm typecheck
pnpm biome:fix

# Create commit
git commit -m "feat(auth): implement JWT token refresh" -m "Add automatic token refresh on 401 responses."
```

**If AGENTS.md updates were confirmed/auto-applied:**

```bash
# Edit the AGENTS.md files (read first, edit between markers, update timestamp)
# Then stage and amend or create a separate commit:

# Stage AGENTS.md files for update
git add <path-to-AGENTS.md>

# Amend the commit (keeps everything atomic)
git commit --amend --no-edit

# OR create separate docs commit:
git commit -m "docs: update AGENTS.md with new commands and scope"
```

**AGENTS.md update execution checklist:**
1. Read the target AGENTS.md file
2. Update `Last updated` date to today
3. Edit content between the correct `<!-- AGENTS-GENERATED:START/END -->` markers
4. Verify markers are intact after editing
5. Stage the file
6. If creating a new AGENTS.md for a feature folder, use `feature-agents-md` skill or create a minimal one

**If commit fails:**
- Pre-commit hook rejected → fix the issue and retry
- No changes staged → verify files exist and have changes
- Tell user what went wrong and how to fix

## Edge Cases

### Auto-Approve Specific Edge Cases

- **Auto-approve with nothing to commit:** "No changes detected. Nothing to commit." (don't ask for confirmation)
- **Auto-approve with no changes in scoped path:** "No changes found in `src/auth/`. Nothing to commit."
- **Auto-approve with path that doesn't exist:** "Path `src/auth/` does not exist. Nothing to commit."
- **Auto-approve Portuguese flags:** `--sim`, `--auto-aprovar`, `--sem-confirmar` all trigger auto-approve

### Path Scoping Specific Edge Cases

- **Path is a directory with nested changes:** `git add src/auth/` stages everything recursively — analyze the full diff within that subtree
- **Path is a single file:** `git add src/api/routes.ts` stages only that file — scope the commit message to its changes
- **Multiple paths across different scopes:** `commit src/auth/ package.json` — stage both, infer scope from the most significant path
- **Path with glob-like syntax:** User says "all the test files" — resolve with `git status --short` to find matching paths, then scope to those
- **Path is already staged:** If files in the scoped path are already staged, just commit them directly
- **Path has staged AND unstaged changes:** Stage all changes in the scoped path: `git add <path>` before committing

### Unstaged changes
If user has unstaged changes and wants to commit:
1. Show which files are unstaged
2. Ask: "Stage and commit these changes?" or "Stage only specific files?"
3. In auto-approve mode: stage all changed files in scope and commit

### Mixed unrelated changes
If a single file has unrelated changes (e.g., auth + styling in same file):
1. Explain the changes are mixed
2. Suggest: `git add -p` for interactive staging
3. Offer to help create separate commits

### Working directory not clean
Before committing, check:
- No merge conflicts
- No uncommitted changes in unrelated files (warn user)

### Large commits
If commit touches >10 files or >500 lines:
1. Warn: "This is a large commit (N files, ~N lines)"
2. Suggest splitting into smaller commits
3. Ask if user wants help identifying split points

### New feature folders
If the diff creates a new feature folder under `src/features/*/`, `src/components/*/`, `src/hooks/*/`, or `src/lib/*/`:
1. Propose creating a new AGENTS.md for that feature (use `feature-agents-md` skill)
2. Add the new folder to the nearest parent's `scope-index`
3. Example: New `src/features/payments/` → propose creating `src/features/payments/AGENTS.md` and updating `src/features/AGENTS.md`'s scope-index

### No AGENTS.md updates detected
If the diff contains only routine changes (bugfixes, small tweaks) with no AGENTS.md-relevant information:
1. State: "No AGENTS.md updates needed for this diff"
2. Proceed with commit normally
3. Don't force AGENTS.md updates where none are warranted

## Complete Workflow Decision Tree

```
User says "commit ..."
│
├── Contains --yes/-y/--auto-approve/--sim/--auto-aprovar/--sem-confirmar?
│   └─ Yes → auto_approve = true
│
├── Contains a file path or directory?
│   └─ Yes → scope_paths = [extracted paths]
│
├── Run: git status --short [-- <scope_paths>]
├── Run: git diff HEAD [-- <scope_paths>]
│
├── Validate scope_paths (if provided):
│   ├── Path doesn't exist → warn and stop
│   ├── Path has no changes → "Nothing to commit"
│   └── Valid → continue
│
├── Analyze diff:
│   ├── Group related changes
│   ├── Generate commit message(s)
│   └── Detect AGENTS.md updates
│
├── auto_approve?
│   ├── Yes → Show proposal, execute immediately (single commit), auto-apply AGENTS.md updates
│   └── No  → Show proposal, ask for confirmation, then execute
│
└── Commit complete
```

## Examples

### Example 1: Simple feature commit

**User:** "commit my changes"

**You:**
1. Run `git status --short` → see `src/modules/auth/login.tsx`, `tests/auth.test.ts`
2. Run `git diff HEAD` → see JWT implementation
3. Propose:
   ```
   ## Proposed Commit
   
   **Files:** src/modules/auth/login.tsx, tests/auth.test.ts
   
   **Message:** feat(auth): implement JWT-based authentication
   
   Proceed? (yes/no)
   ```
4. User confirms → `git add` + `git commit`

### Example 2: Auto-approve with --yes

**User:** "commit --yes my auth changes"

**You:**
1. Parse: `auto_approve = true`, `scope_paths = null`
2. Run `git status --short` → see `src/modules/auth/login.tsx`, `tests/auth.test.ts`
3. Run `git diff HEAD` → see JWT implementation
4. Show and execute immediately:
   ```
   ## Auto-approved Commit
   
   **Files:** src/modules/auth/login.tsx, tests/auth.test.ts
   **Message:** feat(auth): implement JWT-based authentication
   
   Executing commit now...
   ```
5. `git add src/modules/auth/login.tsx tests/auth.test.ts`
6. `git commit -m "feat(auth): implement JWT-based authentication"`

### Example 3: Path-scoped commit

**User:** "commit only src/modules/auth/"

**You:**
1. Parse: `auto_approve = false`, `scope_paths = ["src/modules/auth/"]`
2. Run `git status --short -- src/modules/auth/` → see `src/modules/auth/login.tsx`, `src/modules/auth/hooks.ts`
3. Run `git diff HEAD -- src/modules/auth/` → see auth-only changes
4. (Note: `tests/auth.test.ts` is NOT included because it's outside the scope)
5. Propose:
   ```
   ## Proposed Commit (scoped to src/modules/auth/)
   
   **Files:** src/modules/auth/login.tsx, src/modules/auth/hooks.ts
   **Message:** feat(auth): implement JWT-based authentication
   
   Proceed? (yes/no)
   ```

### Example 4: Auto-approve + path scope combined

**User:** "commit -y src/server/routes.ts"

**You:**
1. Parse: `auto_approve = true`, `scope_paths = ["src/server/routes.ts"]`
2. Run `git status --short -- src/server/routes.ts` → single file
3. Run `git diff HEAD -- src/server/routes.ts` → route changes
4. Show and execute:
   ```
   ## Auto-approved Commit (scoped to src/server/routes.ts)
   
   **Files:** src/server/routes.ts
   **Message:** feat(server): add new API routes
   
   Executing commit now...
   ```
5. `git add src/server/routes.ts && git commit -m "feat(server): add new API routes"`

### Example 5: Portuguese auto-approve

**User:** "commita tudo --sim"

**You:**
1. Parse: `auto_approve = true` (recognizes `--sim`), `scope_paths = null`
2. Run `git status --short`, `git diff HEAD`
3. Show and execute immediately (no confirmation)

### Example 6: Multiple unrelated changes (manual mode)

**User:** "create a commit"

**You:**
1. Run `git status` → see auth files + CSS file + README
2. Analyze: 3 unrelated concerns
3. Propose split:
   ```
   ## Detected 3 unrelated changes
   
   I recommend splitting into separate commits:
   
   **Commit 1** - Auth feature
   - src/modules/auth/*
   Message: feat(auth): implement token refresh
   
   **Commit 2** - UI styling
   - src/components/button.css
   Message: style(ui): update button hover states
   
   **Commit 3** - Documentation
   - README.md
   Message: docs: add auth setup guide
   
   Proceed with all 3 commits? (yes / no / commit only first / custom)
   ```

### Example 7: Fix with tests (auto-approve)

**User:** "commit -y the fix for the user api bug"

**You:**
1. Parse: `auto_approve = true`
2. Run `git diff` → see bugfix in `src/api/user.ts` + test in `tests/api/user.test.ts`
3. Recognize: fix + test = single commit
4. Show and execute:
   ```
   ## Auto-approved Commit
   
   **Files:** src/api/user.ts, tests/api/user.test.ts
   **Message:** fix(api): handle 404 in user fetch
   
   Add proper error handling when user not found.
   Includes test for 404 response.
   
   Executing commit now...
   ```

### Example 8: New feature with AGENTS.md update (auto-approve)

**User:** "commit --yes my payments feature"

**You:**
1. Parse: `auto_approve = true`
2. Run `git status` → see new `src/features/payments/`, `package.json`
3. Run `git diff HEAD` → see new `pnpm payments:report` script
4. Detect: new feature folder + new command
5. Show and auto-execute:
   ```
   ## Auto-approved Commit

   **Files:** src/features/payments/*, package.json

   **Message:** feat(payments): add payment reporting feature

   **Auto-applied AGENTS.md updates:**
   - Root `AGENTS.md` — Add `pnpm payments:report` to Commands table
   - Root `AGENTS.md` — Add `src/features/payments/AGENTS.md` to scope-index
   - `src/features/AGENTS.md` — Update scope-index

   Executing commit now...
   ```

### Example 9: Path doesn't exist

**User:** "commit src/nonexistent/"

**You:**
1. Run `ls -d src/nonexistent/` → no such file
2. Respond: `Path "src/nonexistent/" does not exist. Nothing to commit.`

### Example 10: Scoped path with no changes

**User:** "commit package.json"

**You:**
1. Run `git status --short -- package.json` → no output (unchanged)
2. Respond: `No changes found in "package.json". Nothing to commit.`

## Anti-Patterns

**NEVER:**
- Commit without showing proposed message first (unless auto-approve is active)
- Use vague messages like "fix stuff", "update", "changes"
- Include unrelated changes in same commit without warning
- Skip confirmation step (unless auto-approve is active)
- Use past tense ("added", "fixed") - use imperative ("add", "fix")
- Add period at end of subject line
- Make subject line >72 characters
- Edit AGENTS.md content outside AGENTS-GENERATED markers
- Remove or rename AGENTS-GENERATED markers
- Skip updating the "Last updated" timestamp when editing AGENTS.md
- Guess AGENTS.md contents without reading the file first
- Ignore the scope path — only commit the files the user asked for

**ALWAYS:**
- Run `git status` and `git diff` first (with scope paths if provided)
- Group related changes logically
- Follow Conventional Commits format
- Ask for confirmation before committing (unless auto-approve is active)
- Mention scope when clear from file paths
- Detect and propose AGENTS.md updates when relevant info is in the diff
- Read AGENTS.md files before editing them
- Update content only between AGENTS-GENERATED markers
- Update the "Last updated" timestamp on every AGENTS.md edit
- Target the nearest AGENTS.md to the changed files, not just root
- Validate that scoped paths exist and have changes before proceeding
- Show "Auto-approved" indicator in the proposal when auto-approve is active
