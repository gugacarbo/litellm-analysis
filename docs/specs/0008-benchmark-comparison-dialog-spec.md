---
status: implemented
date: 2026-07-06
builds-on:
  - SPEC-0006
  - SPEC-0007
implemented-by:
  - packages/contracts/src/benchmarks.ts
  - packages/server/src/orchestration/openrouter-models.ts
  - packages/server/src/orchestration/benchmark-helpers.ts
  - packages/server/src/routes/model-routes.ts
  - apps/web/src/shared/lib/api-client/models.ts
  - apps/web/src/features/models/hooks/use-benchmark-comparison.ts
  - apps/web/src/features/models/components/benchmark-comparison-dialog.tsx
  - apps/web/src/features/models/detail/model-detail-settings-tab.tsx
---

# Botão na tela de settings do modelo que abre um dialog comparativo entre AA e OpenRouter com importação campo a campo

> Shared conventions: `apps/web/AGENTS.md` — feature isolation, page-level hooks
> colocated with pages, shadcn/ui primitives from `@/shared/components/ui`. This
> spec builds on the benchmark database storage (SPEC-0006) and the model config
> screen refactor (SPEC-0007).

## Objective

Permitir que o operador, na tela de settings de um modelo (`/models/:modelName/settings`),
abra um dialog que exibe um comparativo lado a lado entre os dados disponíveis no
Artificial Analysis e no OpenRouter (benchmarks + models API) para aquele modelo,
e importe campos individuais para o formulário de configuração com um clique.

## Flow

### 1. Botão no ModelDetailSettingsTab

1. O operador navega para `/models/:modelName/settings`.
2. Ao lado do título da página ou do formulário, existe um botão "Comparar Benchmarks"
   (ícone `Scale` ou `GitCompare` do Lucide).
3. O botão fica desabilitado (`disabled`) enquanto os dados do dialog não estão
   carregados ou enquanto o modelo atual não tem match com nenhuma entrada de benchmark.

### 2. Abertura do dialog

4. Ao clicar no botão, o frontend dispara `GET /api/models/:name/benchmark-comparison`.
5. Enquanto carrega, o dialog mostra um skeleton/spinner.
6. Quando os dados chegam, o dialog exibe a tabela comparativa.

### 3. Tabela comparativa

7. O dialog tem título "Comparar Benchmarks — {modelName}".
8. A tabela tem as seguintes colunas:
   - **Campo** — nome do campo de configuração (ex: "Preço input (por 1M tokens)")
   - **Artificial Analysis** — valor do AA (ou "—" se indisponível)
   - **OpenRouter** — valor do OpenRouter (ou "—" se indisponível)
   - **Atual** — valor atualmente configurado no formulário
   - **Ação** — botão "Importar" por linha

9. As linhas da tabela são:

   | Campo | Fonte AA | Fonte OpenRouter |
   |-------|----------|------------------|
   | Display Name | `name` do benchmark AA | `display_name` da Models API |
   | Family | — (não disponível) | `family` da Models API (quando existir) |
   | Owned By | `creatorName` do benchmark AA | `creatorName` do benchmark OpenRouter |
   | API Mode | — (não disponível) | derivado de `capabilities` da Models API |
   | Vision | — (não disponível) | `capabilities.supports_vision` da Models API |
   | Context Window | — (não disponível) | `context_length` da Models API |
   | Max Output Tokens | — (não disponível) | `max_output_tokens` da Models API |
   | Input Cost (por 1M tokens) | `priceInput1mTokens` | `pricing.prompt` da Models API |
   | Output Cost (por 1M tokens) | `priceOutput1mTokens` | `pricing.completion` da Models API |

10. Cada linha tem um botão "Importar" na coluna Ação. O botão só aparece quando
    o valor da fonte é diferente do valor atual e não é nulo.

### 4. Importação campo a campo

11. Ao clicar em "Importar" em uma linha, o valor daquela fonte é aplicado
    imediatamente ao campo correspondente no formulário de configuração.
12. O formulário **não** é salvo automaticamente — o operador ainda precisa clicar
    em "Save" no formulário principal para persistir.
13. Após importar, o valor na coluna "Atual" é atualizado para refletir o novo valor.
14. O botão "Importar" some daquela linha (pois o valor agora é igual ao atual).
15. Um toast do Sonner confirma: "Campo '{campo}' importado de {fonte}."

### 5. Fechamento do dialog

16. O dialog pode ser fechado pelo X, clicando fora, ou pressionando Escape.
17. Ao reabrir o dialog, os dados são re-carregados (não cacheados) para refletir
    o estado atual do formulário.

## Contract

### Endpoint: `GET /api/models/:name/benchmark-comparison`

**Response shape:**

```typescript
interface BenchmarkComparisonResponse {
  modelName: string;
  matchedAaModel: string | null;       // nome do modelo no AA que deu match
  matchedOpenRouterModel: string | null; // permaslug do modelo no OpenRouter que deu match
  fields: BenchmarkComparisonField[];
}

interface BenchmarkComparisonField {
  key: string;                          // identificador do campo (ex: "inputCostPerToken")
  label: string;                        // label amigável (ex: "Preço input (por 1M tokens)")
  currentValue: string | number | boolean | null;  // valor atual no modelo configurado
  aa: {
    value: string | number | boolean | null;
    source: "artificial-analysis";
    sourceLabel: string;                // ex: "Artificial Analysis"
  } | null;                            // null quando o campo não existe nessa fonte
  openrouter: {
    value: string | number | boolean | null;
    source: "openrouter";
    sourceLabel: string;               // ex: "OpenRouter"
  } | null;
}
```

**Matching logic:**
- Usa o sistema de aliases existente (`@storage/benchmarks/model-aliases.json`)
  para mapear o `modelName` para entradas de benchmark.
- Para AA: match por alias → slug → nome exato → fuzzy (suffix-tolerant).
- Para OpenRouter benchmarks: mesmo sistema de aliases.
- Para OpenRouter Models API: busca direta pelo nome do modelo na API do OpenRouter
  (`GET https://openrouter.ai/api/v1/models`), filtrando pelo nome ou permaslug
  que deu match nos benchmarks.

**Fontes de dados:**
1. **AA benchmarks:** `model_proxy_benchmarks` table (source = `artificial-analysis`)
   ou fallback para `@storage/benchmarks/artificial-analysis-models.json`.
2. **OpenRouter benchmarks:** `model_proxy_benchmarks` table (source = `openrouter`)
   ou fallback para `@storage/benchmarks/openrouter-benchmarks.json`.
3. **OpenRouter Models API:** chamada HTTP direta para `https://openrouter.ai/api/v1/models`
   (não cacheada — feita sob demanda no momento da request).

### Frontend: `BenchmarkComparisonDialog`

**Props:**
```typescript
interface BenchmarkComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelName: string;
  currentValues: Record<string, unknown>;  // valores atuais do formulário
  onImportField: (key: string, value: unknown, source: string) => void;
}
```

**Localização:** `apps/web/src/features/models/components/benchmark-comparison-dialog.tsx`

**Hook de dados:** `apps/web/src/features/models/hooks/use-benchmark-comparison.ts`
- Usa `@tanstack/react-query` com `useQuery`.
- Query key: `["benchmark-comparison", modelName]`.
- Chama `fetchApi<BenchmarkComparisonResponse>(\`/models/${modelName}/benchmark-comparison\`)`.

### Integração no ModelDetailSettingsTab

No `model-detail-settings-tab.tsx`, adicionar o botão e o dialog:

```tsx
// Dentro do componente, após obter o model do contexto
const [comparisonOpen, setComparisonOpen] = useState(false);

// No JSX, antes ou depois do ModelConfigForm
<Button
  variant="outline"
  size="sm"
  onClick={() => setComparisonOpen(true)}
>
  <Scale className="h-4 w-4 mr-2" />
  Comparar Benchmarks
</Button>

<BenchmarkComparisonDialog
  open={comparisonOpen}
  onOpenChange={setComparisonOpen}
  modelName={model.modelName}
  currentValues={formData}
  onImportField={(key, value, source) => {
    // atualiza o form data com o valor importado
    updateField(key, value);
    toast.success(`Campo importado de ${source}`);
  }}
/>
```

## Edge cases

| # | WHEN ⟨trigger⟩ | the system MUST ⟨response⟩ |
|---|---------------|---------------------------|
| 1 | O modelo atual não tem match com nenhuma entrada de benchmark (AA nem OpenRouter) | exibir o botão desabilitado com tooltip "Nenhum benchmark encontrado para este modelo" |
| 2 | O modelo tem match só com AA ou só com OpenRouter | exibir apenas a coluna da fonte disponível; a outra coluna mostra "—" em todas as linhas |
| 3 | Um campo existe em uma fonte mas é `null` | exibir "—" na célula correspondente; não mostrar botão "Importar" |
| 4 | O valor da fonte é igual ao valor atual | não mostrar botão "Importar" nessa linha |
| 5 | A OpenRouter Models API retorna erro ou timeout | exibir "—" em todas as células do OpenRouter para campos que dependem da Models API; logar o erro no console |
| 6 | O modelo tem múltiplos matches no OpenRouter Models API (ex: mesmo nome, providers diferentes) | usar o primeiro match; se houver ambiguidade, preferir o match cujo `creatorName` bate com o provider configurado |
| 7 | O operador importa um campo mas depois fecha o dialog sem salvar o formulário | o valor importado fica no formulário (estado local); o operador precisa clicar em "Save" para persistir |
| 8 | O operador abre o dialog, importa campos, fecha, reabre | os dados são re-carregados; o estado atual do formulário é refletido na coluna "Atual" |
| 9 | O campo importado tem tipo diferente do esperado pelo formulário (ex: string vs number) | o endpoint normaliza os tipos; o frontend faz coerção segura antes de aplicar |
| 10 | A OpenRouter Models API requer API key e ela não está configurada | o endpoint tenta chamada anônima (a Models API do OpenRouter é pública para leitura); se falhar, trata como erro |

## Questões em aberto

Nenhuma — todos os edge cases foram decididos.

## Definition of Done

```bash
pnpm typecheck                     # exit 0
pnpm test                          # tudo verde
```

## Human review

- Verificar visualmente o dialog em `/models/:modelName/settings` com um modelo
  que tenha match em ambos os benchmarks (ex: `gpt-4o`).
- Verificar o comportamento com um modelo sem match (botão desabilitado).
- Verificar a importação campo a campo e confirmar que o formulário reflete os
  valores importados.

## Verificação

```text
(fill in at close)
```
