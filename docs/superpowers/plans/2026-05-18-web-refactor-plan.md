# Web Refactor: Hybrid Feature Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `apps/web/src/` para estrutura Hybrid com features auto-contidas e `shared/` para código reutilizável.

**Architecture:** 
- `features/` agrupa código por feature (components, hooks, types, utils)
- `shared/` contém código reutilizável entre features
- 1 componente por arquivo (exceto shadcn), máximo 150 linhas por arquivo
- Imports via path aliases (`@/features/`, `@/shared/`)

**Tech Stack:** React 19, TypeScript, Vite, React Router, React Query

---

## Constraints

- **1 componente por arquivo**: Exceto componentes shadcn (mantidos agrupados)
- **Máximo 150 linhas por arquivo**: Componentes maiores devem ser divididos
- **Commits atômicos**: 1 commit por feature migrada
- **Testes mantidos**: Tests migrados junto com código

---

## File Mapping Reference

### Shared (destinado a `shared/`)

| Original | Novo |
|----------|------|
| `components/ui/*.tsx` | `shared/components/ui/` |
| `components/layout/*.tsx` | `shared/components/layout/` |
| `components/theme-provider.tsx` | `shared/contexts/theme-provider.tsx` |
| `lib/*.ts` | `shared/lib/` |
| `lib/api-client/*.ts` | `shared/lib/api-client/` |
| `hooks/use-mobile.ts` | `shared/hooks/use-mobile.ts` |
| `contexts/*.tsx` | `shared/contexts/` |
| `types/*.ts` | `shared/types/` |

### Features (cada uma em `features/<name>/`)

| Feature | Componentes | Hooks | Types/Utils |
|---------|-------------|-------|-------------|
| dashboard | `components/dashboard/*` | `hooks/use-dashboard-data*`, `hooks/dashboard/*` | `pages/dashboard/*` |
| models | `components/models/*` | `hooks/use-model-detail-data.ts` | `pages/models/*` |
| model-stats | `components/model-stats/*` | (hooks em pages) | `pages/model-stats/*` |
| agents | `components/agent-config-editor/*` | (hooks em pages) | `pages/agent-config/*` |
| agent-routing | `components/agent-routing/*` | `hooks/use-agent-routing*` | `pages/agent-routing/*` |
| logs | `components/logs/*` | `hooks/use-logs.ts` | `pages/logs/*` |
| errors | `components/errors/*` | `hooks/use-errors.ts` | `pages/errors/*` |
| plugins | `components/plugin-routing/*` | `hooks/use-plugin-routing.ts`, `hooks/use-plugin-config.ts` | `pages/plugin-config/*` |
| benchmarks | - | (hooks em pages) | `pages/benchmarks/*` |
| health-status | - | (hooks em pages) | `pages/health-status/*` |
| monitor | `components/monitor/*` | `hooks/use-monitor-websocket.ts` | - |
| prompts | - | (hooks em pages) | `pages/prompt-evals/*` |

---

## Phase 1: Setup

### Task 1.1: Update tsconfig.json

**Files:**
- Modify: `apps/web/tsconfig.json`

- [ ] **Step 1: Add path aliases**

Adicionar em `paths`:

```json
"@/features/*": ["src/features/*"],
"@/shared/*": ["src/shared/*"]
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/tsconfig.json
git commit -m "refactor(web): add @/features and @/shared path aliases"
```

---

### Task 1.2: Create directory structure

**Files:**
- Create: `apps/web/src/shared/`
- Create: `apps/web/src/features/`
- Create: `apps/web/src/features/dashboard/`
- Create: `apps/web/src/features/models/`
- Create: `apps/web/src/features/agents/`
- Create: `apps/web/src/features/logs/`
- Create: `apps/web/src/features/errors/`
- Create: `apps/web/src/features/plugins/`
- Create: `apps/web/src/features/benchmarks/`
- Create: `apps/web/src/features/monitor/`
- Create: `apps/web/src/features/prompts/`
- Create: `apps/web/src/features/model-stats/`
- Create: `apps/web/src/features/health-status/`

- [ ] **Step 1: Create all directories**

```bash
mkdir -p apps/web/src/shared/{components/{ui,layout},hooks,lib/{api-client},contexts,types}
mkdir -p apps/web/src/features/{dashboard,models,agents,logs,errors,plugins,benchmarks,monitor,prompts,model-stats,health-status}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/shared apps/web/src/features
git commit -m "refactor(web): create shared and features directory structure"
```

---

## Phase 2: Migrate Shared

### Task 2.1: Migrate shadcn UI components

**Files:**
- Move: `components/ui/*.tsx` → `shared/components/ui/`

- [ ] **Step 1: Move all shadcn components**

```bash
mv components/ui/*.tsx shared/components/ui/
mv components/ui/__tests__ shared/components/ui/
```

- [ ] **Step 2: Update imports in moved files**

Change `../../lib/utils` → `@/shared/lib/utils`
Change `../lib/utils` → `@/shared/lib/utils`

- [ ] **Step 3: Commit**

```bash
git add shared/components/ui/
git rm components/ui/*.tsx
git commit -m "refactor(web): move shadcn ui components to shared"
```

---

### Task 2.2: Migrate layout components

**Files:**
- Move: `components/layout/*.tsx` → `shared/components/layout/`

- [ ] **Step 1: Move layout components**

```bash
mv components/layout/*.tsx shared/components/layout/
```

- [ ] **Step 2: Update imports**

- `sidebar.tsx`: Change `../../lib/utils` → `@/shared/lib/utils`
- `sidebar.tsx`: Change `../../contexts/filter-context` → `@/shared/contexts/filter-context`

- [ ] **Step 3: Commit**

```bash
git add shared/components/layout/
git rm -r components/layout/
git commit -m "refactor(web): move layout components to shared"
```

---

### Task 2.3: Migrate contexts and theme-provider

**Files:**
- Move: `contexts/*.tsx` → `shared/contexts/`
- Move: `components/theme-provider.tsx` → `shared/contexts/theme-provider.tsx`

- [ ] **Step 1: Move contexts**

```bash
mv contexts/*.tsx shared/contexts/
mv components/theme-provider.tsx shared/contexts/
```

- [ ] **Step 2: Update imports in moved files**

- `theme-provider.tsx`: Update `../../lib/utils` → `@/shared/lib/utils`
- `filter-context.tsx`: Update imports as needed

- [ ] **Step 3: Commit**

```bash
git add shared/contexts/
git rm -r contexts/
git rm components/theme-provider.tsx
git commit -m "refactor(web): move contexts to shared"
```

---

### Task 2.4: Migrate shared hooks

**Files:**
- Move: `hooks/use-mobile.ts` → `shared/hooks/`

- [ ] **Step 1: Move use-mobile**

```bash
mv hooks/use-mobile.ts shared/hooks/
```

- [ ] **Step 2: Commit**

```bash
git add shared/hooks/
git rm hooks/use-mobile.ts
git commit -m "refactor(web): move use-mobile to shared hooks"
```

---

### Task 2.5: Migrate shared lib

**Files:**
- Move: `lib/*.ts` (excluindo api-client) → `shared/lib/`
- Move: `lib/api-client/*.ts` → `shared/lib/api-client/`
- Move: `lib/__tests__` → `shared/lib/__tests__/`

- [ ] **Step 1: Move lib files**

```bash
mv lib/*.ts shared/lib/
mv lib/api-client shared/lib/
mv lib/__tests__ shared/lib/
```

- [ ] **Step 2: Update api-client imports**

In each file in `shared/lib/api-client/`, update relative imports to use `@/shared/lib/` prefix.

- [ ] **Step 3: Commit**

```bash
git add shared/lib/
git rm -r lib/
git commit -m "refactor(web): move lib to shared"
```

---

### Task 2.6: Migrate shared types

**Files:**
- Move: `types/*.ts` → `shared/types/`

- [ ] **Step 1: Move types**

```bash
mv types/*.ts shared/types/
```

- [ ] **Step 2: Commit**

```bash
git add shared/types/
git rm -r types/
git commit -m "refactor(web): move types to shared"
```

---

## Phase 3: Migrate Features

### Task 3.1: Migrate Dashboard feature

**Files:**
- Create: `features/dashboard/components/`
- Create: `features/dashboard/hooks/`
- Create: `features/dashboard/types/`
- Create: `features/dashboard/utils/`
- Create: `features/dashboard/index.ts`

- Move: `components/dashboard/*` → `features/dashboard/components/`
- Move: `hooks/use-dashboard-data*` → `features/dashboard/hooks/`
- Move: `hooks/dashboard/*` → `features/dashboard/hooks/`
- Move: `pages/dashboard/*` → `features/dashboard/`
- Move: `pages/dashboard.tsx` → `features/dashboard/index.ts`

**Splits necessários (máx 150 linhas):**
- `dashboard-overview-cards.tsx` (~100 lines) → pode manter
- `dashboard-usage-charts.tsx` (~300 lines) → SPLIT em:
  - `dashboard-usage-charts.tsx` (container, ~50 lines)
  - `dashboard-usage-chart-content.tsx` (lógica principal)
  - `dashboard-usage-chart-tabs.tsx` (tabs)
- `dashboard-efficiency-charts.tsx` (~200 lines) → SPLIT
- `dashboard-insights.tsx` (~150 lines) → pode manter
- `dashboard-top-entities.tsx` (~150 lines) → pode manter

**Sub-chart splits:**
- `dashboard-usage-charts/daily-spend-chart.tsx`
- `dashboard-usage-charts/token-distribution-chart.tsx`
- `dashboard-usage-charts/model-distribution-chart.tsx`
→ Mover para `features/dashboard/components/`

- [ ] **Step 1: Create dashboard subdirectories**

```bash
mkdir -p features/dashboard/{components,hooks,types,utils}
```

- [ ] **Step 2: Move and split components**

Split `dashboard-usage-charts.tsx` if >150 lines:
- Create container component
- Create tab content component
- Move sub-charts

- [ ] **Step 3: Move hooks**

```bash
mv hooks/use-dashboard-data.ts features/dashboard/hooks/ 2>/dev/null || true
mv hooks/use-dashboard-data/* features/dashboard/hooks/
mv hooks/dashboard/* features/dashboard/hooks/
```

- [ ] **Step 4: Move types and utils**

```bash
mv pages/dashboard/dashboard-types.ts features/dashboard/types/
mv pages/dashboard/dashboard-utils.ts features/dashboard/utils/
```

- [ ] **Step 5: Move page and create index**

```bash
mv pages/dashboard.tsx features/dashboard/index.ts
```

- [ ] **Step 6: Update all imports**

Update all imports in feature to use:
- `@/shared/components/ui/` for UI components
- `@/shared/hooks/` for shared hooks
- `@/shared/lib/` for utilities

- [ ] **Step 7: Commit**

```bash
git add features/dashboard/
git rm -r components/dashboard/
git rm -r hooks/use-dashboard-data/
git rm -r hooks/dashboard/
git rm pages/dashboard/
git commit -m "refactor(web): migrate dashboard to features"
```

---

### Task 3.2: Migrate Models feature

**Files:**
- Create: `features/models/{components,hooks,types,utils}/`
- Move: `components/models/*` → `features/models/components/`
- Move: `hooks/use-model-detail-data.ts` → `features/models/hooks/`
- Move: `pages/models/*` → `features/models/`
- Move: `pages/models.tsx` → `features/models/index.ts`

**Splits necessários:**
- `model-config-form.tsx` (~400 lines) → SPLIT em:
  - `model-config-form.tsx` (container)
  - `model-config-general-section.tsx`
  - `model-config-pricing-section.tsx`
  - `model-config-limits-section.tsx`
  - `model-config-aliases-section.tsx`

- [ ] **Step 1: Create structure and move**

```bash
mkdir -p features/models/{components,hooks,types,utils}
mv components/models/* features/models/components/
mv hooks/use-model-detail-data.ts features/models/hooks/
mv pages/models/model-form-data.ts features/models/types/
mv pages/models/models-utils.ts features/models/utils/
mv pages/models.tsx features/models/index.ts
```

- [ ] **Step 2: Split large components**

Split `model-config-form.tsx` into smaller sections.

- [ ] **Step 3: Update imports and commit**

---

### Task 3.3: Migrate Model Stats feature

**Files:**
- Create: `features/model-stats/{components,hooks,types,utils}/`
- Move: `components/model-stats/*` → `features/model-stats/components/`
- Move: `pages/model-stats/*` → `features/model-stats/`
- Move: `pages/model-stats.tsx` → `features/model-stats/index.ts`

**Splits necessários:**
- `model-stats-data-table.tsx` (~400 lines) → SPLIT em:
  - `model-stats-data-table.tsx` (container)
  - `model-stats-table-columns.tsx`
  - `model-stats-table-cell-renderers.tsx`
  - `model-stats-sort-handlers.tsx`
- `model-stats-summary-cards.tsx` (~200 lines) → SPLIT
- `model-stats-header.tsx` (~100 lines) → pode manter

- [ ] **Step 1: Create structure and move**

```bash
mkdir -p features/model-stats/{components,hooks,types,utils}
mv components/model-stats/* features/model-stats/components/
mv pages/model-stats/model-stats-types.ts features/model-stats/types/
mv pages/model-stats/model-stats-utils.ts features/model-stats/utils/
mv pages/model-stats.tsx features/model-stats/index.ts
```

- [ ] **Step 2: Split large components and commit**

---

### Task 3.4: Migrate Agents features

**Files:**
- Create: `features/agents/{components,hooks,types,utils}/`
- Create: `features/agent-routing/{components,hooks,types,utils}/`
- Move: `components/agent-config-editor/*` → `features/agents/components/`
- Move: `components/agent-routing/*` → `features/agent-routing/components/`
- Move: `pages/agent-config/*` → `features/agents/`
- Move: `pages/agent-routing/*` → `features/agent-routing/`
- Move: `pages/agent-config.tsx` → `features/agents/index.ts`
- Move: `pages/agent-routing.tsx` → `features/agent-routing/index.ts`
- Move: `pages/agents.tsx` → `features/agents/list-index.ts`

**Splits necessários:**
- `agent-config-form.tsx` (~400 lines) → SPLIT em:
  - `agent-config-form.tsx` (container)
  - `agent-config-general-section.tsx`
  - `agent-config-model-section.tsx`
  - `agent-config-tools-section.tsx`
  - `agent-config-advanced-section.tsx`

- [ ] **Step 1: Create structures and move**

```bash
mkdir -p features/agents/{components,hooks,types,utils}
mkdir -p features/agent-routing/{components,hooks,types,utils}
mv components/agent-config-editor/* features/agents/components/
mv components/agent-routing/* features/agent-routing/components/
mv pages/agent-config/* features/agents/
mv pages/agent-routing/* features/agent-routing/
mv pages/agent-config.tsx features/agents/index.ts
mv pages/agent-routing.tsx features/agent-routing/index.ts
mv pages/agents.tsx features/agents/list-index.ts
```

- [ ] **Step 2: Split large components and commit**

---

### Task 3.5: Migrate Logs feature

**Files:**
- Create: `features/logs/{components,hooks,types,utils}/`
- Move: `components/logs/*` → `features/logs/components/`
- Move: `hooks/use-logs.ts` → `features/logs/hooks/`
- Move: `pages/logs/*` → `features/logs/`
- Move: `pages/logs.tsx` → `features/logs/index.ts`

**Splits necessários:**
- `logs-table.tsx` (~300 lines) → SPLIT
- `logs-filter-card.tsx` (~150 lines) → pode manter
- `logs-pagination.tsx` (~100 lines) → pode manter

- [ ] **Step 1: Create structure and move**

```bash
mkdir -p features/logs/{components,hooks,types,utils}
mv components/logs/* features/logs/components/
mv hooks/use-logs.ts features/logs/hooks/
mv pages/logs/logs-utils.ts features/logs/utils/
mv pages/logs.tsx features/logs/index.ts
```

- [ ] **Step 2: Split large components and commit**

---

### Task 3.6: Migrate Errors feature

**Files:**
- Create: `features/errors/{components,hooks,types,utils}/`
- Move: `components/errors/*` → `features/errors/components/`
- Move: `hooks/use-errors.ts` → `features/errors/hooks/`
- Move: `pages/errors-utils.ts` → `features/errors/utils/`
- Move: `pages/logs-errors-tab.tsx` → `features/errors/index.ts`

**Splits necessários:**
- `errors-table.tsx` (~300 lines) → SPLIT
- `errors-summary-cards.tsx` (~200 lines) → SPLIT

- [ ] **Step 1: Create structure and move**

```bash
mkdir -p features/errors/{components,hooks,types,utils}
mv components/errors/* features/errors/components/
mv hooks/use-errors.ts features/errors/hooks/
mv pages/errors-utils.ts features/errors/utils/
mv pages/logs-errors-tab.tsx features/errors/index.ts
```

- [ ] **Step 2: Split large components and commit**

---

### Task 3.7: Migrate Plugins feature

**Files:**
- Create: `features/plugins/{components,hooks,types,utils}/`
- Move: `components/plugin-routing/*` → `features/plugins/components/`
- Move: `hooks/use-plugin-routing.ts`, `hooks/use-plugin-config.ts` → `features/plugins/hooks/`
- Move: `pages/plugin-config/*` → `features/plugins/`
- Move: `pages/plugin-config.tsx` → `features/plugins/index.ts`
- Move: `pages/plugins.tsx` → `features/plugins/list-index.ts`

**Splits necessários:**
- `plugin-config-form.tsx` (~300 lines) → SPLIT

- [ ] **Step 1: Create structure and move**

```bash
mkdir -p features/plugins/{components,hooks,types,utils}
mv components/plugin-routing/* features/plugins/components/
mv hooks/use-plugin-routing.ts features/plugins/hooks/
mv hooks/use-plugin-config.ts features/plugins/hooks/
mv pages/plugin-config/* features/plugins/
mv pages/plugin-config.tsx features/plugins/index.ts
mv pages/plugins.tsx features/plugins/list-index.ts
```

- [ ] **Step 2: Split large components and commit**

---

### Task 3.8: Migrate remaining features

**Features restantes:**
- benchmarks
- health-status
- monitor
- prompts

- [ ] **Step 1: Migrate benchmarks**

```bash
mkdir -p features/benchmarks/{components,hooks,types,utils}
mv pages/benchmarks/* features/benchmarks/
mv pages/benchmarks.tsx features/benchmarks/index.ts
```

- [ ] **Step 2: Migrate health-status**

```bash
mkdir -p features/health-status/{components,hooks,types,utils}
mv pages/health-status/* features/health-status/
mv pages/health-status.tsx features/health-status/index.ts
```

- [ ] **Step 3: Migrate monitor**

```bash
mkdir -p features/monitor/{components,hooks,types,utils}
mv components/monitor/* features/monitor/components/
mv hooks/use-monitor-websocket.ts features/monitor/hooks/
mv pages/monitor.tsx features/monitor/index.ts
```

- [ ] **Step 4: Migrate prompts**

```bash
mkdir -p features/prompts/{components,hooks,types,utils}
mv pages/prompt-evals/* features/prompts/
mv pages/prompts.tsx features/prompts/index.ts
mv pages/prompt-evals.tsx features/prompts/list-index.ts
```

- [ ] **Step 5: Commit all remaining features**

```bash
git add features/benchmarks/ features/health-status/ features/monitor/ features/prompts/
git rm -r components/monitor/
git commit -m "refactor(web): migrate remaining features (benchmarks, health, monitor, prompts)"
```

---

## Phase 4: Update App and Cleanup

### Task 4.1: Update App.tsx imports

**Files:**
- Modify: `pages/App.tsx` → `pages/index.tsx` (renamed)

- [ ] **Step 1: Rename App.tsx to index.tsx**

```bash
mv pages/App.tsx pages/index.tsx
```

- [ ] **Step 2: Update all page imports**

Change:
```typescript
// From:
import { DashboardPage } from "./pages/dashboard";
// To:
import { DashboardPage } from "@/features/dashboard";
```

Update all 12+ page imports.

- [ ] **Step 3: Update relative paths**

Change `./components/` imports to `@/shared/components/`
Change `./contexts/` imports to `@/shared/contexts/`

- [ ] **Step 4: Commit**

```bash
git add pages/index.tsx
git commit -m "refactor(web): update App imports to use new paths"
```

---

### Task 4.2: Clean up empty directories

**Files:**
- Remove: `components/`, `hooks/`, `pages/`, `lib/` (vazios)

- [ ] **Step 1: Remove empty directories**

```bash
rmdir components/ hooks/ lib/ pages/ types/ 2>/dev/null || true
```

- [ ] **Step 2: Commit cleanup**

```bash
git commit -m "chore(web): remove empty source directories"
```

---

### Task 4.3: Update vite.config.ts

**Files:**
- Modify: `apps/web/vite.config.ts`

- [ ] **Step 1: Add path aliases to Vite**

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
    "@/features": path.resolve(__dirname, "./src/features"),
    "@/shared": path.resolve(__dirname, "./src/shared"),
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add vite.config.ts
git commit -m "refactor(web): add @/features and @/shared aliases to Vite"
```

---

## Phase 5: Verify

### Task 5.1: Run typecheck

- [ ] **Step 1: Run TypeScript check**

```bash
pnpm --filter web typecheck
```

Expected: No errors (fix any import errors found)

- [ ] **Step 2: Fix any type errors**

Address any type errors found during migration.

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix(web): resolve type errors from migration"
```

---

### Task 5.2: Run build

- [ ] **Step 1: Run build**

```bash
pnpm --filter web build
```

Expected: Build succeeds

- [ ] **Step 2: Commit if no issues**

```bash
git commit -m "chore(web): verify build passes after refactor"
```

---

### Task 5.3: Run tests

- [ ] **Step 1: Run tests**

```bash
pnpm --filter web test
```

Expected: All tests pass

- [ ] **Step 2: Commit if no issues**

```bash
git commit -m "chore(web): verify tests pass after refactor"
```

---

### Task 5.4: Manual verification

- [ ] **Step 1: Start dev server**

```bash
pnpm --filter web dev
```

- [ ] **Step 2: Verify pages load**

Navigate to:
- [ ] Dashboard (/)
- [ ] Logs (/logs)
- [ ] Models (/models)
- [ ] Agents (/agents)
- [ ] Plugins (/plugins)
- [ ] Benchmarks (/benchmarks)
- [ ] Monitor (/monitor)
- [ ] Prompt Evals (/prompt-evals)

Expected: All pages render without errors

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 2 | Setup: tsconfig, directory structure |
| 2 | 6 | Migrate shared code |
| 3 | 8 | Migrate 11 features |
| 4 | 3 | Update App, cleanup |
| 5 | 4 | Verify build, tests, manual |

**Total: 23 tasks**

---

## Open Questions Resolution

Based on spec:

- [x] **errors/ dentro de logs?**: Mantido como `features/errors/` separado (lógica distinta)
- [x] **prompt-evals → prompts?**: Mantido como `features/prompts/` (mais descritivo)
- [x] **Componentes compartilhados**: Vão para `shared/components/` ou duplicados por feature? → **Duplicados por feature** (mais encapsulated)
