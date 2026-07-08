---
status: draft
date: 2026-07-08
builds-on:
  - ADR-0004
  - ADR-0006
implemented-by: []
---

# Model registry adopts an OpenRouter-first schema with explicit reasoning API relations and no legacy compatibility fields

> Convenções compartilhadas: `docs/context/CONVENTIONS.md`. Esta spec mantém
> PostgreSQL + Drizzle como source of truth, preserva `camelCase` no contrato
> público e limita `snake_case` à persistência.

## Objective

Simplificar o registry de modelos para que a tabela principal, os contratos de
API e os adapters usem um schema coerente, tipado e alinhado ao OpenRouter
sempre que isso trouxer baixo drift e facilite importação automática. Após este
trabalho, o app deixa de expor ou persistir campos legados redundantes como
`owned_by`, `metadata`, `vision`, `context_window_size` e dados de upstream
duplicados por modelo, substituindo-os por um contrato canônico com
`modelId`, `contextLength`, `architecture`, `reasoning`, `pricing` e relação
explícita com provider e com a entidade compartilhada de reasoning API. Esta
mudança é um hard cut sem suporte transitório a formatos legados: o código
impactado deve ser atualizado para o novo contrato, não adaptado com shims,
aliases, dual-read ou dual-write.

## Flow

1. Um processo administrativo ou de sync descobre modelos a partir de uma fonte
   externa, incluindo OpenRouter.
2. O importer normaliza os dados externos para o contrato canônico do app,
   preservando semanticamente os nomes e shapes do OpenRouter quando eles forem
   a fonte de verdade do domínio (`context_length`, `architecture`,
   `supported_parameters`, `pricing`, `default_parameters`,
   `per_request_limits`), mas convertendo-os para `camelCase` no contrato
   público e nos serviços internos do app.
3. O server persiste os dados na tabela `model_proxy_models`, mantendo
   `provider_id` como relação explícita e sem duplicar no modelo os campos de
   upstream resolvíveis pelo provider.
4. O server persiste ou referencia a entidade compartilhada de reasoning API,
   usada por vários modelos para transformar a configuração canônica de
   `reasoning` em payload HTTP específico de vendor.
5. A API administrativa de modelos expõe apenas o contrato canônico em
   `camelCase`, sem aliases legados e sem superfícies paralelas equivalentes.
6. A UI administrativa lê, cria e atualiza modelos usando somente esse
   contrato canônico.
7. Ao montar uma request real para um provider, o runtime combina:
   `modelId` + `provider` + `reasoning` + `reasoningApi` para gerar o payload
   final do vendor, sem depender de `metadata` genérico.

## Contract

### Model contract

- O identificador canônico do modelo no contrato público passa a ser `modelId`.
- `modelName` deixa de existir como campo público aceito ou retornado.
- `contextWindowSize` deixa de existir e é substituído por `contextLength`.
- `ownedBy`, `metadata`, `vision`, `upstreamModel`, `upstreamBaseUrl` e
  `providerName` deixam de existir no contrato público do modelo.
- O campo público `name` representa o nome legível do modelo.
- O campo público `canonicalSlug` preserva o identificador externo estável
  importado do OpenRouter quando disponível.
- A identidade canônica persistida do modelo no registry é
  `UNIQUE(provider_id, model_id)`.
- `canonicalSlug` não participa da identidade principal do registro; ele é um
  identificador externo importado, útil para sync, referência e troubleshooting.

### OpenRouter-first fields

- `architecture` passa a ser um objeto estruturado alinhado ao OpenRouter.
- `architecture` deve ser persistido como `jsonb` no schema principal, sem
  colunas derivadas nesta rodada.
- `pricing` passa a ser um objeto estruturado alinhado ao OpenRouter e é a
  source of truth para custos no schema principal.
- `supportedParameters`, `defaultParameters` e `perRequestLimits` passam a ser
  campos explícitos do modelo.
- `contextLength`, `description`, `knowledgeCutoff`, `expirationDate` e
  `maxCompletionTokens` devem poder ser preenchidos automaticamente a partir do
  OpenRouter quando disponíveis.
- O alinhamento ao OpenRouter é semântico e estrutural, não de casing público:
  importer e adapters podem consumir `snake_case`, mas API, services e frontend
  do app continuam usando apenas `camelCase`.

### Reasoning contract

- `reasoning` é o único bloco canônico para capacidade/configuração de
  thinking/reasoning no modelo.
- `thinking` deixa de existir como bloco separado.
- `reasoning` descreve semântica de produto/capability do modelo, não o payload
  específico de um vendor.
- `reasoning` deve ser persistido como `jsonb` no schema principal, sem
  colunas derivadas nesta rodada.
- `reasoning.apiMode` ou qualquer duplicação equivalente não é permitida; o
  `apiMode` do modelo continua sendo a única fonte de verdade para esse conceito
  no topo do contrato.

### Reasoning API relation

- O app deve introduzir uma entidade relacional compartilhada para descrever o
  shape de request de reasoning por vendor/variante.
- Essa entidade deve ser reutilizável por vários modelos.
- Ela deve suportar pelo menos:
  - identificador estável
  - provider associado
  - versão explícita
  - `requestParams` declarativos
  - `requestShape` com placeholders/expressões resolvidos em runtime
- O vínculo do modelo com essa entidade deve permitir que um mesmo shape seja
  compartilhado entre múltiplos modelos sem duplicação de blobs inline.
- A identidade da entidade deve ser versionada explicitamente para permitir
  coexistência de shapes incompatíveis, por exemplo `deepseek-thinking:v1` e
  `deepseek-thinking:v2`.

### Persistence and boundaries

- PostgreSQL continua sendo a única source of truth.
- Drizzle schema continua sendo a fonte da verdade para migrations.
- `snake_case` permanece restrito à persistência.
- O contrato público de API, services e frontend usa apenas `camelCase`.
- Este trabalho é um hard cut: não devem permanecer aliases operacionais de
  compatibilidade para os campos removidos/renomeados.
- Nenhum adapter, service, route, fixture ou componente deve manter leitura ou
  escrita de formatos deprecated como estratégia de transição.
- Todo consumer impactado no repo deve ser atualizado para o novo contrato na
  mesma implementação.

## Edge cases

| # | WHEN ⟨trigger⟩ | the system MUST ⟨response⟩ |
| --- | --- | --- |
| 1 | QUANDO um cliente enviar `modelName`, `contextWindowSize`, `ownedBy`, `vision` ou `metadata` na API administrativa | o sistema DEVE rejeitar a request com erro 4xx explícito, sem normalização silenciosa |
| 2 | QUANDO um modelo tiver provider relacionado mas não possuir campos de upstream duplicados na tabela principal | o sistema DEVE resolver os dados de upstream a partir da relação com provider, não por fallback em colunas removidas |
| 3 | QUANDO um modelo suportar reasoning com shape específico de vendor | o sistema DEVE gerar a request final a partir da combinação entre `reasoning` canônico e a entidade compartilhada de reasoning API |
| 4 | QUANDO um modelo não suportar reasoning | o sistema DEVE permitir `reasoning` nulo ou desabilitado sem exigir vínculo com a entidade de reasoning API |
| 5 | QUANDO o OpenRouter não fornecer algum campo opcional como `knowledge_cutoff` ou `per_request_limits` | o sistema DEVE persistir `null` ou vazio tipado, sem inventar valores derivados |
| 6 | QUANDO a UI precisar exibir capacidades multimodais ou custos | o sistema DEVE ler `architecture` e `pricing` canônicos, nunca `vision` ou colunas achatadas legadas |
| 7 | QUANDO existir fixture, teste ou adapter ainda dependente de `metadata.thinking` ou `metadata.reasoning` | o sistema DEVE migrar esse consumer para `reasoning` canônico ou manter teste explícito de rejeição do formato legado |
| 8 | QUANDO um vendor introduzir um novo payload de reasoning incompatível com a versão anterior | o sistema DEVE criar uma nova versão explícita de `reasoningApi` em vez de mutar silenciosamente o shape antigo |
| 9 | QUANDO um consumer interno ainda depender de um campo removido ou renomeado | o sistema DEVE atualizar esse consumer para o contrato novo, nunca introduzir camada de compatibilidade para preservá-lo funcionando |

## Open questions

- [x] Nenhuma.

## Definition of Done

```bash
pnpm typecheck
pnpm test
```

Além disso:
- [x] O contrato público de modelos passa a expor apenas os nomes canônicos
  novos.
- [x] O schema principal de modelos deixa de conter os campos removidos nesta
  spec.
- [x] `pricing` fica estruturado e alinhado ao OpenRouter como source of truth.
- [x] `reasoning` substitui definitivamente `thinking` + `metadata`.
- [x] Existe uma entidade relacional compartilhável para shape de request de
  reasoning.
- [x] Não permanecem shims, aliases, dual-read, dual-write ou suporte
  operacional a formatos deprecated nos pontos impactados do repo.

## Human review

- Revisar se a chave única escolhida para o modelo continua compatível com sync,
  deduplicação e UX administrativa.
- Revisar visualmente a tela de modelos após a troca para `architecture`,
  `pricing` e novos nomes de campos.
- Validar se os shapes de `reasoningApi` cobrem os vendors prioritários antes
  de começar uma importação automática em massa.

## Verification

```text
Preencher no fechamento da implementação com:
- resultado dos comandos de DoD
- evidência de migrations/schema
- evidência de contratos/API/UI atualizados
- evidência de cobertura para rejeição dos campos legados
```
