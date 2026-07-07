---
status: implemented
date: 2026-07-07
builds-on:
  - SPEC-0002
  - SPEC-0003
implemented-by:
  - packages/contracts/src/analytics.ts
  - packages/server/src/routes/model-routes.ts
  - packages/server/src/orchestration/route-params.ts
  - packages/server/src/orchestration/registry-models-bridge.ts
  - services/llm-config-service/src/types/model-route.ts
  - services/llm-config-service/src/adapters/model-route-adapter.ts
  - apps/web/src/features/models/models-utils.ts
  - apps/web/src/shared/lib/api-client/models.ts
---

# ModelRoute becomes the only accepted model contract across web, server, contracts, and persistence adapters

> Convenções compartilhadas (nomenclatura, bordas de persistência, source of
> truth): `docs/context/CONVENTIONS.md`. Esta spec endurece essas convenções e
> remove superfícies que ainda as contradizem.

## Objetivo

Eliminar definitivamente os shapes paralelos e as compatibilidades legadas do
fluxo de modelos. Após este trabalho, a stack inteira deve conhecer apenas um
contrato público para modelos roteáveis: `ModelRoute` em `camelCase`. A API de
modelos, os contracts compartilhados, o server, os adapters e a UI deixam de
aceitar, produzir ou depender de aliases legados como `litellmParams`,
`snake_case` exposto fora da persistência, `Record<string, unknown>` sem tipo
ou shapes paralelos equivalentes.

## Fluxo

1. Um cliente administrativo lista modelos via API.
2. O server responde com modelos cujo shape público usa apenas o contrato atual:
   `modelName` + `modelRoute` tipado em `camelCase`, além dos campos
   explicitamente pertencentes à superfície de config/status.
3. A web consome esse contrato tipado sem normalizações locais de chaves
   legadas, sem fallback para `snake_case` e sem helpers que inspecionam payload
   genérico.
4. A tabela de modelos recebe uma estrutura derivada pronta para renderização,
   já com colunas de contexto, custos, status e health resolvidas.
5. Ao criar ou atualizar um modelo, o cliente envia apenas o contrato atual.
6. A borda HTTP rejeita payloads legados com erro 4xx explícito; não há shim de
   aceitação para `litellmParams`, nomes LiteLLM antigos ou campos públicos em
   `snake_case`.
7. O server converte o contrato apenas nas bordas necessárias de persistência:
   `camelCase` no domínio e API, `snake_case` apenas em schema/adapters de banco.
8. O runtime deixa de manter shapes paralelos para route/config de modelo quando
   esses shapes representarem a mesma informação do contrato canônico.
9. Testes, fixtures e documentação passam a refletir somente o contrato atual.

## Contrato

### Contrato canônico único

- `ModelRoute` é o único contrato público de roteamento de modelos.
- O tipo compartilhado deve ser importável por web, server e contracts.
- O contrato público usa somente `camelCase`.
- `snake_case` é permitido apenas em colunas PostgreSQL e nos adapters de
  persistência.

### Superfícies que devem convergir

- `packages/contracts` não pode mais expor `modelRoute: Record<string, unknown>`
  em contratos públicos que descrevem o fluxo atual de modelos.
- `apps/web` não pode mais calcular colunas da tabela lendo chaves legadas como
  `input_cost_per_token`, `context_window_size` ou `max_tokens` de objetos
  genéricos.
- `packages/server` não pode mais aceitar `litellmParams`, aliases LiteLLM,
  route params antigos ou shapes paralelos equivalentes na borda HTTP de
  modelos.
- `packages/server/src/routes/model-routes.ts` e orquestrações correlatas não
  podem manter um shape alternativo persistente para a mesma informação já
  coberta por `ModelRoute`, exceto quando estritamente necessário para uma
  configuração de produto que não pertence ao contrato de roteamento. Nesse
  caso, a responsabilidade deve ficar isolada em um tipo próprio e com fronteira
  explícita.

### Tabela de modelos

- A tabela de modelos deve consumir um shape derivado, tipado e pronto para
  renderização.
- O componente de tabela não deve conhecer detalhes de compatibilidade, parsing
  de payload bruto ou fallback entre nomes antigos e novos.
- Cálculos de apresentação como `Context`, `Max Output`, `Input ($/Mi)` e
  `Output ($/Mi)` devem partir de campos canônicos tipados.

### Compatibilidade

- Este é um hard cut. Consumidores que ainda enviam payload legado deixam de ser
  suportados.
- A resposta da API também deixa de refletir aliases de compatibilidade.
- Não reintroduzir dual-read, dual-write, normalização silenciosa ou wrappers de
  transição fora de testes explicitamente marcados como cobertura de rejeição.

## Casos de borda

| # | QUANDO ⟨gatilho⟩ | o sistema DEVE ⟨resposta⟩ |
|---|---|---|
| 1 | QUANDO um cliente enviar `litellmParams` ou qualquer alias legado em vez de `modelRoute` | o sistema DEVE rejeitar a request com erro 4xx explícito informando que apenas `modelRoute` é aceito |
| 2 | QUANDO um cliente enviar campos públicos em `snake_case` na API de modelos | o sistema DEVE rejeitar a request com erro 4xx explícito, sem normalizar silenciosamente |
| 3 | QUANDO um helper ou componente de UI precisar ler custo, contexto ou max output | o sistema DEVE ler apenas campos canônicos tipados, nunca chaves legadas em payload genérico |
| 4 | QUANDO uma fixture ou teste antigo depender de `Record<string, unknown>` para `modelRoute` | o sistema DEVE atualizar a fixture para o tipo canônico ou manter um teste explícito de rejeição do payload antigo |
| 5 | QUANDO existir informação de tela/config que não pertence semanticamente a `ModelRoute` | o sistema DEVE modelá-la em um tipo separado e nomeado, em vez de estender `ModelRoute` ou criar um shape paralelo ambíguo |
| 6 | QUANDO a persistência exigir nomes de coluna em `snake_case` | o sistema DEVE fazer a conversão apenas em schema/adapters de banco, sem vazar esse naming para contracts, routes ou UI |
| 7 | QUANDO uma rota, service ou adapter reencontrar semântica LiteLLM antiga ainda viva | o sistema DEVE removê-la ou isolá-la como rejeição explícita, não preservá-la como fallback operacional |

## Questões em aberto

- [x] Nenhuma.

## Definition of Done

```bash
pnpm typecheck
pnpm test
```

Além disso:
- [x] As APIs de modelos aceitam apenas o contrato atual.
- [x] `packages/contracts`, `apps/web` e `packages/server` compartilham o tipo
  canônico de `ModelRoute` ou um alias tipado equivalente derivado dele.
- [x] A tabela de modelos não depende mais de payload genérico nem de leitura de
  chaves legadas.
- [x] Não permanecem superfícies operacionais que usem `litellmParams` ou nomes
  públicos legados fora de testes de rejeição.

## Revisão humana

- Revisar se ainda existe algum consumidor administrativo externo ao repo que
  dependa da aceitação de payload legado na API de modelos.
- Revisar se a separação entre `ModelRoute` e campos realmente não pertencentes
  ao roteamento permaneceu clara após a limpeza do server.
- Validar visualmente a tabela de modelos e o fluxo de create/update/edit depois
  do hard cut.

## Verificação

```text
pnpm typecheck  → exit 0 (todos os packages)
pnpm test       → todos verdes

Evidência por camada:
  contracts:  api-contracts.test.ts  — valida que ModelRoute é o único contrato público
  server:     model-routes.ts        — rejeita litellmParams com 4xx (testes em registry-integration.test.ts)
  server:     route-params.test.ts   — route params colapsados, sem shapes paralelos
  web:        models-gates.test.tsx  — tabela lê apenas campos canônicos tipados
  web:        models-utils.ts        — sem fallback para chaves legadas
  llm-config: model-route-adapter.test.ts — adapter canonicalizado, sem aliases

Commit final: 35ec65b (test: refresh regression coverage for hard cut)
```
