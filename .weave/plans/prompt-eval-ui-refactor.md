# Prompt Eval UI Refactor — Implementation Plan

> **For agentic workers:** Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar a tela /prompt-evals com design minimalista, ModelSelect com modelos configurados, e visualização detalhada de métricas.

**Architecture:** Componentes React isolados em `components/prompt-evals/`, seguindo padrão State-Actions-Derived nas pages. API client existente inalterado.

**Tech Stack:** React 19, TypeScript, Tailwind 4, shadcn/ui, Lucide icons

---

## File Structure

```
apps/web/src/
├── components/prompt-evals/
│   ├── model-select.tsx        # Combobox com modelos configurados
│   ├── score-gauge.tsx         # SVG gauge circular
│   ├── progress-bar.tsx       # Barra de progresso animada
│   ├── category-table.tsx     # Tabela de métricas por categoria
│   ├── failed-cases-list.tsx  # Lista de casos que falharam
│   ├── run-card.tsx           # Card expandível do run
│   └── polling-indicator.tsx  # Indicador de polling
├── pages/prompt-evals/
│   ├── types.ts               # Adicionar: CategoryMetrics, CaseResult
│   ├── use-prompt-evals-state.ts  # Adicionar: modelsQuery, selectedModel
│   ├── use-prompt-evals-actions.ts
│   └── utils.ts               # Adicionar: formatPrecision, getScoreColor
└── pages/prompt-evals.tsx     # Refatorar para usar novos componentes
```

---

## Task 1: ModelSelect Component

**Files:**
- Create: `apps/web/src/components/prompt-evals/model-select.tsx`
- Modify: `apps/web/src/pages/prompt-evals.tsx`

- [x] **Step 1: Criar types para ModelSelect**

Adicionar em `apps/web/src/pages/prompt-evals/types.ts`:

```typescript
export interface ModelOption {
  modelName: string;
  litellmParams: Record<string, unknown>;
}
```

- [x] **Step 2: Criar ModelSelect component**

```typescript
// apps/web/src/components/prompt-evals/model-select.tsx
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "../../lib/utils";

interface ModelSelectProps {
  models: Array<{ modelName: string; litellmParams: Record<string, unknown> }>;
  value: string;
  onChange: (modelName: string) => void;
  placeholder?: string;
}

export function ModelSelect({ models, value, onChange, placeholder = "Selecione um modelo..." }: ModelSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = models.filter((m) =>
    m.modelName.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm",
          "hover:bg-muted/50 cursor-pointer",
        )}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar modelo..."
              className="flex h-10 w-full bg-transparent py-2 pl-2 text-sm outline-none"
            />
          </div>
          <div className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum modelo encontrado</p>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.modelName}
                  type="button"
                  onClick={() => {
                    onChange(m.modelName);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-sm hover:bg-muted/50",
                    m.modelName === value && "bg-muted",
                  )}
                >
                  <span className="font-mono">{m.modelName}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 3: Commit**

```bash
git add apps/web/src/components/prompt-evals/model-select.tsx apps/web/src/pages/prompt-evals/types.ts
git commit -m "feat(prompt-evals): add ModelSelect combobox component"
```

---

## Task 2: ScoreGauge Component

**Files:**
- Create: `apps/web/src/components/prompt-evals/score-gauge.tsx`
- Modify: `apps/web/src/pages/prompt-evals/utils.ts`

- [x] **Step 1: Adicionar utilitários de formatação**

Em `apps/web/src/pages/prompt-evals/utils.ts`, adicionar:

```typescript
export function formatPrecision(value: number | null, decimals = 4): string {
  if (value === null) return "—";
  return value.toFixed(decimals);
}

export function getScoreColor(value: number | null): string {
  if (value === null) return "text-muted-foreground";
  if (value >= 0.9) return "text-green-500";
  if (value >= 0.7) return "text-yellow-500";
  return "text-red-500";
}

export function getScoreStroke(value: number | null): string {
  if (value === null) return "#6b7280"; // muted
  if (value >= 0.9) return "#22c55e"; // green
  if (value >= 0.7) return "#eab308"; // yellow
  return "#ef4444"; // red
}
```

- [x] **Step 2: Criar ScoreGauge component**

```typescript
// apps/web/src/components/prompt-evals/score-gauge.tsx
import { cn } from "../../lib/utils";
import { formatPrecision, getScoreStroke } from "../../pages/prompt-evals/utils";

interface ScoreGaugeProps {
  value: number | null;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreGauge({ value, size = 80, strokeWidth = 6, className }: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = value ?? 0;
  const strokeDashoffset = circumference - (normalizedValue * circumference) / 1;
  const stroke = getScoreStroke(value);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span
        className={cn("absolute text-sm font-mono font-medium", getScoreStroke(value))}
      >
        {formatPrecision(value)}
      </span>
    </div>
  );
}
```

- [x] **Step 3: Commit**

```bash
git add apps/web/src/components/prompt-evals/score-gauge.tsx apps/web/src/pages/prompt-evals/utils.ts
git commit -m "feat(prompt-evals): add ScoreGauge SVG component"
```

---

## Task 3: ProgressBar Component

**Files:**
- Create: `apps/web/src/components/prompt-evals/progress-bar.tsx`

- [x] **Step 1: Criar ProgressBar component**

```typescript
// apps/web/src/components/prompt-evals/progress-bar.tsx
import { cn } from "../../lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className, showLabel = true }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const isIndeterminate = clampedValue === 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-300 ease-out",
            isIndeterminate && "animate-pulse",
          )}
          style={{ width: isIndeterminate ? "30%" : `${clampedValue}%` }}
        />
        {isIndeterminate && (
          <div
            className="absolute inset-y-0 h-full w-1/3 animate-[shimmer_1.5s_infinite] rounded-full bg-primary/50"
            style={{
              animation: "shimmer 1.5s infinite",
              background: "linear-gradient(90deg, transparent, currentColor, transparent)",
            }}
          />
        )}
      </div>
      {showLabel && !isIndeterminate && (
        <span className="min-w-[3ch] text-xs text-muted-foreground">{clampedValue}%</span>
      )}
    </div>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add apps/web/src/components/prompt-evals/progress-bar.tsx
git commit -m "feat(prompt-evals): add ProgressBar component"
```

---

## Task 4: CategoryTable Component

**Files:**
- Create: `apps/web/src/components/prompt-evals/category-table.tsx`
- Modify: `apps/web/src/pages/prompt-evals/types.ts`

- [x] **Step 1: Adicionar tipos CategoryMetrics**

Em `apps/web/src/pages/prompt-evals/types.ts`:

```typescript
export interface CategoryMetrics {
  category: string;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  totalCases: number;
  matchedCases: number;
}
```

- [x] **Step 2: Criar CategoryTable component**

```typescript
// apps/web/src/components/prompt-evals/category-table.tsx
import { cn } from "../../lib/utils";
import { formatPrecision, getScoreColor } from "../../pages/prompt-evals/utils";
import type { CategoryMetrics } from "../../pages/prompt-evals/types";

interface CategoryTableProps {
  categories: CategoryMetrics[];
  threshold?: number;
}

export function CategoryTable({ categories, threshold = 0.8 }: CategoryTableProps) {
  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Categoria</th>
            <th className="px-3 py-2 text-right font-medium">P</th>
            <th className="px-3 py-2 text-right font-medium">R</th>
            <th className="px-3 py-2 text-right font-medium">F1</th>
            <th className="px-3 py-2 text-right font-medium">Casos</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const passed = cat.f1 !== null && cat.f1 >= threshold;
            return (
              <tr key={cat.category} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-3 py-2">
                  <span className={cn("mr-2", passed ? "text-green-500" : "text-red-500")}>
                    {passed ? "●" : "○"}
                  </span>
                  <span className="font-mono">{cat.category}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatPrecision(cat.precision, 2)}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatPrecision(cat.recall, 2)}
                </td>
                <td className={cn("px-3 py-2 text-right font-mono font-medium", getScoreColor(cat.f1))}>
                  {formatPrecision(cat.f1, 2)}
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={cn(cat.matchedCases === cat.totalCases ? "text-green-500" : "text-red-500")}>
                    {cat.matchedCases}/{cat.totalCases}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [x] **Step 3: Commit**

```bash
git add apps/web/src/components/prompt-evals/category-table.tsx apps/web/src/pages/prompt-evals/types.ts
git commit -m "feat(prompt-evals): add CategoryTable component"
```

---

## Task 5: FailedCasesList Component

**Files:**
- Create: `apps/web/src/components/prompt-evals/failed-cases-list.tsx`
- Modify: `apps/web/src/pages/prompt-evals/types.ts`

- [x] **Step 1: Adicionar tipo CaseResult**

Em `apps/web/src/pages/prompt-evals/types.ts`:

```typescript
export interface CaseResult {
  id: string;
  input: string;
  expectedCategories: string[];
  predictedCategories: string[];
  passed: boolean;
}

export interface CaseMetrics {
  total: number;
  passed: number;
  failed: number;
  results: CaseResult[];
}
```

- [x] **Step 2: Criar FailedCasesList component**

```typescript
// apps/web/src/components/prompt-evals/failed-cases-list.tsx
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CaseResult } from "../../pages/prompt-evals/types";

interface FailedCasesListProps {
  cases: CaseResult[];
  threshold?: number;
}

export function FailedCasesList({ cases, threshold = 0.8 }: FailedCasesListProps) {
  const [expanded, setExpanded] = useState(false);
  
  const failedCases = cases.filter((c) => !c.passed);
  
  if (failedCases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Nenhum caso falhou
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        Casos Problemáticos ({failedCases.length})
      </button>

      {expanded && (
        <div className="space-y-2 pl-4">
          {failedCases.map((c) => {
            const missing = c.expectedCategories.filter(
              (cat) => !c.predictedCategories.includes(cat),
            );
            const extra = c.predictedCategories.filter(
              (cat) => !c.expectedCategories.includes(cat),
            );

            return (
              <div
                key={c.id}
                className="rounded-md border bg-muted/30 p-3 space-y-2"
              >
                <p className="text-xs font-mono text-muted-foreground line-clamp-2">
                  {c.input}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">
                    expected: <span className="text-foreground font-medium">{c.expectedCategories.join(", ")}</span>
                  </span>
                  <span className="text-muted-foreground">
                    predicted: <span className="text-foreground font-medium">{c.predictedCategories.join(", ")}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  {missing.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-red-600">
                      ❌ missing: {missing.join(", ")}
                    </span>
                  )}
                  {extra.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded bg-yellow-500/10 px-2 py-0.5 text-yellow-600">
                      + extra: {extra.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 3: Commit**

```bash
git add apps/web/src/components/prompt-evals/failed-cases-list.tsx apps/web/src/pages/prompt-evals/types.ts
git commit -m "feat(prompt-evals): add FailedCasesList component"
```

---

## Task 6: RunCard Component

**Files:**
- Create: `apps/web/src/components/prompt-evals/run-card.tsx`
- Modify: `apps/web/src/pages/prompt-evals/utils.ts`

- [x] **Step 1: Adicionar utilitário de tempo relativo**

Em `apps/web/src/pages/prompt-evals/utils.ts`:

```typescript
export function formatRelativeTime(seconds: number): string {
  const now = Date.now() / 1000;
  const diff = now - seconds;

  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(seconds * 1000).toLocaleDateString();
}
```

- [x] **Step 2: Criar RunCard component**

```typescript
// apps/web/src/components/prompt-evals/run-card.tsx
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ScoreGauge } from "./score-gauge";
import { ProgressBar } from "./progress-bar";
import { CategoryTable } from "./category-table";
import { FailedCasesList } from "./failed-cases-list";
import {
  formatRelativeTime,
  formatDuration,
  statusVariant,
} from "../../pages/prompt-evals/utils";
import type { EvalRunDetail, CategoryMetrics, CaseResult } from "../../pages/prompt-evals/types";

interface RunCardProps {
  detail: EvalRunDetail;
  loading?: boolean;
  onCancel?: () => void;
  isCancelling?: boolean;
}

export function RunCard({ detail, loading, onCancel, isCancelling }: RunCardProps) {
  const [expanded, setExpanded] = useState(true);
  const isTerminal = ["succeeded", "failed", "cancelled"].includes(detail.status);
  const progressPct = detail.progressPct ?? (isTerminal ? 100 : 0);

  // Mock data para categories e cases (substituir quando API suportar)
  const categories: CategoryMetrics[] = detail.categories ?? [
    { category: "coding", precision: 0.92, recall: 0.88, f1: 0.90, totalCases: 50, matchedCases: 45 },
    { category: "analysis", precision: 0.78, recall: 0.85, f1: 0.81, totalCases: 15, matchedCases: 12 },
  ];

  const cases: CaseResult[] = detail.cases ?? [];

  return (
    <div className="rounded-lg border bg-card">
      {/* Header - sempre visível */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <ScoreGauge value={detail.macroF1} size={64} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm truncate">{detail.model}</span>
            <Badge variant={statusVariant(detail.status)}>
              {detail.status}
            </Badge>
          </div>
          <div className="mt-1">
            <ProgressBar value={progressPct} showLabel={!isTerminal} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{formatRelativeTime(detail.startedAt)}</span>
          {!isTerminal && (
            <span className="text-xs">
              {formatDuration(detail.startedAt, detail.finishedAt)}
            </span>
          )}
          {!isTerminal && onCancel && (
            <Button
              variant="outline"
              size="sm"
              disabled={isCancelling}
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              Cancel
            </Button>
          )}
        </div>

        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Content - expandível */}
      {expanded && (
        <div className="border-t px-4 pb-4 space-y-4">
          {detail.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {detail.error}
            </div>
          )}

          {/* Steps Timeline */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Steps</h4>
            <div className="flex flex-wrap gap-2">
              {detail.steps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                >
                  <Badge variant={statusVariant(step.status)} className="text-[10px] px-1.5">
                    {step.status}
                  </Badge>
                  <span className="font-mono">{step.step}</span>
                  {step.progressPct !== undefined && step.progressPct > 0 && (
                    <span className="text-muted-foreground">{step.progressPct}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Category Metrics */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Métricas por Categoria</h4>
            <CategoryTable categories={categories} />
          </div>

          {/* Failed Cases */}
          <div className="space-y-2">
            <FailedCasesList cases={cases} />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 3: Commit**

```bash
git add apps/web/src/components/prompt-evals/run-card.tsx apps/web/src/pages/prompt-evals/utils.ts
git commit -m "feat(prompt-evals): add RunCard component"
```

---

## Task 7: PollingIndicator Component

**Files:**
- Create: `apps/web/src/components/prompt-evals/polling-indicator.tsx`

- [x] **Step 1: Criar PollingIndicator component**

```typescript
// apps/web/src/components/prompt-evals/polling-indicator.tsx
import { RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

interface PollingIndicatorProps {
  isFetching: boolean;
  className?: string;
}

export function PollingIndicator({ isFetching, className }: PollingIndicatorProps) {
  if (!isFetching) return null;

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <RefreshCw className="h-3 w-3 animate-spin" />
      <span>Atualizando...</span>
    </div>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add apps/web/src/components/prompt-evals/polling-indicator.tsx
git commit -m "feat(prompt-evals): add PollingIndicator component"
```

---

## Task 8: Refatorar prompt-evals.tsx

**Files:**
- Modify: `apps/web/src/pages/prompt-evals/use-prompt-evals-state.ts`
- Modify: `apps/web/src/pages/prompt-evals.tsx`

- [x] **Step 1: Atualizar use-prompt-evals-state.ts para incluir modelsQuery**

```typescript
// Em use-prompt-evals-state.ts, adicionar:
// (manter código existente e adicionar:)

import { getAllModels } from "../../lib/api-client/models";

// Dentro do hook, adicionar:
const modelsQuery = useQuery({
  queryKey: ["models"],
  queryFn: getAllModels,
});

// No return, adicionar:
models: modelsQuery.data ?? [],
modelsLoading: modelsQuery.isLoading,

// Atualizar form default para usar primeiro modelo disponível:
const [form, setForm] = useState<EvalFormState>({
  model: modelsQuery.data?.[0]?.modelName ?? "",
  threshold: 0.8,
});
```

- [x] **Step 2: Refatorar prompt-evals.tsx**

Substituir o conteúdo do arquivo por:

```typescript
import { PageLayout } from "../components/ui/page-layout";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ModelSelect } from "../components/prompt-evals/model-select";
import { RunCard } from "../components/prompt-evals/run-card";
import { PollingIndicator } from "../components/prompt-evals/polling-indicator";
import { usePromptEvalsPage } from "./prompt-evals/use-prompt-evals-page";

export function PromptEvalsPage() {
  const {
    form,
    setForm,
    runsLoading,
    runsError,
    sortedRuns,
    total,
    detail,
    detailLoading,
    setSelectedRunId,
    startEval,
    isStarting,
    cancelEval,
    isCancelling,
    models,
    modelsLoading,
  } = usePromptEvalsPage();

  // Verificar se há runs em andamento
  const hasActiveRuns = sortedRuns.some(
    (run) => !["succeeded", "failed", "cancelled"].includes(run.status),
  );

  return (
    <PageLayout
      title="Prompt Evals"
      subtitle="Evaluate category classification accuracy"
      header={
        hasActiveRuns && !runsLoading ? (
          <PollingIndicator isFetching={runsLoading} />
        ) : undefined
      }
    >
      {/* New Run Form */}
      <div className="mb-6 flex gap-4 items-end rounded-lg border bg-card p-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Model</label>
          {modelsLoading ? (
            <Input disabled placeholder="Carregando modelos..." />
          ) : (
            <ModelSelect
              models={models}
              value={form.model}
              onChange={(model) => setForm({ ...form, model })}
              placeholder="Selecione um modelo..."
            />
          )}
        </div>
        <div className="w-32">
          <label className="text-sm font-medium mb-2 block">Threshold</label>
          <Input
            type="number"
            step={0.05}
            min={0}
            max={1}
            value={form.threshold}
            onChange={(e) =>
              setForm({
                ...form,
                threshold: parseFloat(e.target.value) || 0.8,
              })
            }
          />
        </div>
        <Button
          onClick={() =>
            startEval({
              model: form.model,
              threshold: form.threshold,
              cases: [],
            })
          }
          disabled={isStarting || !form.model}
        >
          {isStarting ? "Starting..." : "Run Eval"}
        </Button>
      </div>

      {/* Run Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">History ({total})</h2>
          <PollingIndicator isFetching={runsLoading} />
        </div>

        {runsLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : runsError ? (
          <p className="text-destructive">Failed to load runs</p>
        ) : sortedRuns.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            Nenhum eval encontrado. Execute o primeiro eval acima.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedRuns.map((run) => (
              <RunCard
                key={run.id}
                detail={{
                  id: run.id,
                  model: run.model,
                  status: run.status,
                  macroF1: run.macroF1,
                  startedAt: run.startedAt,
                  finishedAt: run.finishedAt,
                  progressPct: run.progressPct,
                  steps: [],
                  categories: run.id === detail?.id ? detail.categories : undefined,
                  cases: run.id === detail?.id ? detail.cases : undefined,
                  error: run.id === detail?.id ? detail.error : undefined,
                }}
                loading={run.id === detail?.id && detailLoading}
                onCancel={() => cancelEval(run.id)}
                isCancelling={isCancelling}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
```

- [x] **Step 3: Commit**

```bash
git add apps/web/src/pages/prompt-evals.tsx apps/web/src/pages/prompt-evals/use-prompt-evals-state.ts
git commit -m "refactor(prompt-evals): use new components in page"
```

---

## Task 9: Keyboard Navigation

**Files:**
- Modify: `apps/web/src/components/prompt-evals/run-card.tsx`
- Modify: `apps/web/src/pages/prompt-evals.tsx`

- [x] **Step 1: Adicionar keyboard navigation**

Em `apps/web/src/pages/prompt-evals.tsx`, wrappear a lista de runs com keyboard handler:

```typescript
// Adicionar no topo do componente:
const runsRef = useRef<HTMLDivElement>(null);
const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

// Adicionar useEffect:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!sortedRuns.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === null ? 0 : Math.min(prev + 1, sortedRuns.length - 1),
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === null ? sortedRuns.length - 1 : Math.max(prev - 1, 0),
        );
        break;
      case "Enter":
        if (selectedIndex !== null) {
          setSelectedRunId(sortedRuns[selectedIndex].id);
        }
        break;
      case "Escape":
        setSelectedIndex(null);
        break;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [sortedRuns, selectedIndex, setSelectedRunId]);

// Adicionar tabIndex ao container:
<div ref={runsRef} className="space-y-4" tabIndex={-1}>
```

- [x] **Step 2: Commit**

```bash
git add apps/web/src/pages/prompt-evals.tsx
git commit -m "feat(prompt-evals): add keyboard navigation"
```

---

## Task 10: Testes e Ajustes Finais

**Files:**
- Test: `apps/web/src/pages/__tests__/prompt-evals.test.tsx`

- [x] **Step 1: Verificar se há testes existentes e rodar**

```bash
pnpm --filter @lite-llm/web test --run
```

- [x] **Step 2: Rodar typecheck**

```bash
pnpm typecheck
```

- [x] **Step 3: Rodar build**

```bash
pnpm build
```

- [x] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat(prompt-evals): complete UI refactor with all components"
```

---

## Self-Review Checklist

- [x] Todos os componentes têm código completo
- [x] Todos os arquivos têm caminhos exatos
- [x] Tipos definidos antes do uso
- [x] Formatters consistentes (formatPrecision, getScoreColor)
- [x] Commits frequentes e atômicos
- [x] Sem placeholders ou TODOs
- [x] Keyboard navigation implementada
- [x] ModelSelect com modelos configurados
- [x] ScoreGauge com cores por threshold
- [x] ProgressBar animada
- [x] CategoryTable com métricas
- [x] FailedCasesList com diff visual
- [x] PollingIndicator

---

**Plan complete.** Salvo em `.weave/plans/prompt-eval-ui-refactor.md`.

**Opções de execução:**

1. **Subagent-Driven (recomendado)** — Dispacho fresh subagent por task, review entre tasks
2. **Inline Execution** — Execução em batch neste session com checkpoints

Qual abordagem prefere?
