# COMPONENTS KNOWLEDGE BASE

## OVERVIEW
UI components directory with shadcn/ui primitives at root and domain-specific modules in subdirectories.

## STRUCTURE
```
components/
├── *.tsx                      # shadcn/ui primitives (button, card, dialog, table, etc.)
├── layout/                    # sidebar.tsx (nav + mode badge)
├── ui/                        # Shared UI components (page-layout.tsx)
├── dashboard/                 # Overview cards, usage charts, efficiency charts
├── logs/                      # Table, filters, pagination, detail dialogs
├── models/                    # Table card and form dialog
├── model-stats/               # Header, data table, summary, merge panel, dialogs
├── agent-routing/            # Agents/aliases tabs, tables, dialogs
├── agent-config-editor/      # Primary, advanced, execution, permissions sections
├── category-config-editor/    # Primary, execution, advanced sections
├── theme-provider.tsx         # Dark/light mode provider
```

## PageLayout Component

Standardized page layout component at `ui/page-layout.tsx`.

### Layout Structure
```
|Title (left)                     | filters (right) |
|subtitle (left)                  | buttons (right)|
| children...                                     |
```

### Interface
```typescript
interface PageLayoutProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  showFilters?: boolean;  // default: true
  filters?: ReactNode;
  buttons?: ReactNode;
  variant?: "default" | "flex";  // "flex" for h-full layouts
  children?: ReactNode;
  className?: string;
}
```

### Usage
- `title` + `subtitle` render on the left side of the header
- `filters` (optional) renders on the right side in a Card with `p-3` padding
- `buttons` (optional) renders on the right side below/beside filters
- Both `filters` and `buttons` are `ReactNode` slots for custom content
- `showFilters={false}` hides the filters slot entirely
- `variant="flex"` uses `flex flex-col gap-6` instead of `p-6 space-y-6`

### Examples
```tsx
// Minimal (no filters, no buttons)
<PageLayout title="Dashboard">
  {children}
</PageLayout>

// With filters and buttons
<PageLayout
  title="Model Statistics"
  subtitle="Performance metrics"
  filters={<SearchInput />}
  buttons={<Button>Save</Button>}
>
  {children}
</PageLayout>

// Flex variant (for monitor page)
<PageLayout title="Monitor" variant="flex" buttons={<ConnectionBadge />}>
  {children}
</PageLayout>
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Standard page layout | `ui/page-layout.tsx` | Title + subtitle left, filters/buttons right |
| Add a new shadcn primitive | Root `*.tsx` | Use `npx shadcn add <component>` |
| Add dashboard visualization | `dashboard/` | Recharts-based charts |
| Add logs table feature | `logs/` | Table + filter-card + pagination pattern |
| Add model management UI | `models/` | Table-card + form-dialog pattern |
| Add model stats feature | `model-stats/` | Columns driven by `MODEL_STATS_COLUMNS` |
| Add agent routing UI | `agent-routing/` | Tabs pattern with table + dialog |

## CONVENTIONS

### Import Patterns
- Import page-level types from `../../pages/{domain}/` not `../../types/`
- `ConfigInfo` type is duplicated locally in `agent-routing/` (deliberate isolation)

### Component Patterns
- Single named function export per file
- No barrel exports inside subdirectories
- Collapsible sections: `expandedSections: Record<string, boolean>` + `onToggleSection`

### Cost Formatting
- Use `getInputCost()`/`getOutputCost()` from page utils
- Format: `$X.XX/Mi` (per million tokens)

### Table Rendering
- `MODEL_STATS_COLUMNS` declarative array from `../../pages/model-stats/model-stats-types` drives table structure

## ANTI-PATTERNS

- Do NOT create `index.ts` barrel exports in subdirectories
- Do NOT import from `../../types/` when page-level types exist
- Do NOT inline cost formatting logic, use page utils
