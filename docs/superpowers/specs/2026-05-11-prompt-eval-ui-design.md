# Prompt Eval UI Refactor — Design Spec

## Overview
Redesenhar a tela `/prompt-evals` com design minimalista focado em informação densa.

## Goals
1. UI Minimalista — Design clean inspirado em ferramentas de dev
2. Visualização Detalhada — Métricas por categoria + casos problemáticos inline
3. Model Select — Combobox com modelos configurados + busca integrada
4. UX Polida — Navegação por teclado, polling indicator, progress bar animada

## Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [Form Card: Model Select + Threshold + Run Button]          │
├─────────────────────────────────────────────────────────────┤
│ [Run Cards List — scrollable]                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Gauge] [Model] [Progress Bar] [Time] [Status]      │   │
│  │─────────────────────────────────────────────────────│   │
│  │ │ Categoria    P       R       F1      │ Casos     │   │
│  │ ├────────────────────────────────────────┼───────────┤   │
│  │ │ coding          0.92    0.88    0.90  │ 45/50 ✓  │   │
│  │ │ analysis        0.78    0.85    0.81  │ 12/15 ✗  │   │
│  │ └────────────────────────────────────────┴───────────┘   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. ModelSelect Combobox
- Lista todos os modelos de `getAllModels()`
- Busca integrada (filtra enquanto digita)
- Autocomplete com `modelName`
- Default: primeiro modelo da lista

### 2. ScoreGauge
- SVG circular minimalista (180° arc)
- Cor baseada no score: >= 0.9 verde, >= 0.7 amarelo, < 0.7 vermelho
- Número central com 4 decimais
- Animação de preenchimento

### 3. ProgressBar
- Largura total do card
- Animação suave de transição
- Porcentagem no canto direito

### 4. RunCard
- Click para expandir/colapsar
- Keyboard: Enter expand, Esc collapse
- Badge de status com cor

### 5. CategoryTable
- Colunas: Categoria, P, R, F1, Casos
- Indicador visual baseado em threshold

### 6. FailedCasesList
- Lista colapsável de casos que falharam
- Diff visual: ✓ matched, ❌ missing, + extra

## Implementation Order
1. ModelSelect + ScoreGauge + ProgressBar
2. CategoryTable + FailedCasesList
3. RunCard component
4. Refatorar prompt-evals.tsx
5. Keyboard navigation + polling indicator

## Files to Modify
- apps/web/src/pages/prompt-evals.tsx
- apps/web/src/pages/prompt-evals/use-prompt-evals-state.ts
- apps/web/src/pages/prompt-evals/types.ts
- NEW: apps/web/src/components/prompt-evals/*.tsx
