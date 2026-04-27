# apps/web/src/pages/

## OVERVIEW

React page components that compose hooks and UI. Each page owns its types, utils, and hooks in subdirectories.

## STRUCTURE

```
pages/
├── dashboard.tsx          # Main dashboard with charts and stats
├── errors.tsx             # Error logs and analysis
├── logs.tsx               # Request logs viewer
├── model-detail.tsx       # Single model details
├── model-stats.tsx        # Model performance table
├── models.tsx             # Model management
├── agent-routing.tsx      # Agent configuration editor
├── dashboard/             # Dashboard-specific types and utils
│   ├── dashboard-types.ts # 10 domain types
│   └── dashboard-utils.ts # Formatters: currency, number, date, duration, percent
├── model-stats/           # Model stats types and utils
│   ├── model-stats-types.ts    # ModelStats, Column, SortField, MODEL_STATS_COLUMNS
│   └── model-stats-utils.ts    # Formatters with NaN guards
├── models/                # Model form types and utils
│   ├── model-form-data.ts      # ModelFormData, FIXED_KEYS, EMPTY_MODEL_FORM_DATA
│   └── models-utils.ts         # getApiBase, getInputCost, getOutputCost
├── agent-routing/         # State-Actions-Derived pattern
│   ├── use-agent-routing-state.ts   # State hook
│   ├── use-agent-routing-actions.ts # Actions hook
│   ├── use-agent-routing-derived.ts # Derived state hook
│   └── use-agent-routing-page.ts    # Composed page hook
└── __tests__/             # Page-level tests
    ├── agent-routing.test.tsx
    ├── models-gates.test.tsx
    └── model-stats-gates.test.tsx
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add a page | `App.tsx` + create file here | Register route in App.tsx first |
| Add page types | `pages/<page>/<page>-types.ts` | Keep types colocated with page |
| Add page utils | `pages/<page>/<page>-utils.ts` | Formatters, helpers, constants |
| Add page hooks | `pages/<page>/use-<page>-*.ts` | Follow State-Actions-Derived pattern |
| Add column schema | `model-stats/model-stats-types.ts` | MODEL_STATS_COLUMNS declarative array |
| Fix formatting | Check `dashboard-utils.ts` vs `model-stats-utils.ts` | Slight variations exist |
| Add page tests | `__tests__/<page>.test.tsx` | Test page components directly |

## CONVENTIONS

- **Pages contain JSX** — subdirectories contain ONLY hooks/types/utils (no JSX)
- **Reverse dependency** — components in `components/` import types/utils from page directories
- **State-Actions-Derived** — complex pages split into 3 hooks composed into 1 page hook
- **Declarative columns** — MODEL_STATS_COLUMNS array drives table rendering (19 columns)
- **Alias resolution** — `resolveModelName()` maps model names through alias table via `useMemo`
- **Cost formatting** — `$X.XX/Mi` (per million tokens) via `getInputCost()`/`getOutputCost()`

## ANTI-PATTERNS

- Don't put JSX in page subdirectories — only in root page files
- Don't import from components into pages — reverse the dependency
- Don't share formatting utils across pages — slight variations are intentional
- Don't forget NaN guards in formatters — model-stats-utils has the pattern
