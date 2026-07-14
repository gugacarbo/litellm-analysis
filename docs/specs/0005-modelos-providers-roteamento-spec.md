---
status: draft
date: 2026-07-13
builds-on:
  - ADR-0001
  - ADR-0002
  - ADR-0003
  - ADR-0004
  - ADR-0005
  - ADR-0006
  - ADR-0007
  - SPEC-0001
  - SPEC-0002
  - SPEC-0003
implemented-by: []
design-ref: docs/spec-decisions/0005_modelos_providers_roteamento_decisions.md
---

> Process: super-planning — Fase 2 (SPEC). Regras em
> `/home/gustavo/.agents/skills/super-planning/phases/02-spec.md`.

# Administrar modelos, providers e roteamento no apps/ui

> Convenções compartilhadas: `docs/context/CONVENTIONS.md`,
> `docs/context/INFRA.md` e `docs/context/testing-anti-patterns.md`.
> Esta spec deriva as decisões de
> `docs/spec-decisions/0005_modelos_providers_roteamento_decisions.md`.

## Objetivo

Usuários autenticados administrarão modelos, providers, credenciais, aliases e
sincronização upstream pelo `apps/ui`, sem consumir as rotas
administrativas do `apps/server`. Leituras serão permitidas a `admin` e
`viewer`; toda mutação exigirá `admin` e executará no runtime server-side do
TanStack Start.

A etapa substitui os fluxos úteis de modelos do `apps/web` por contratos
provider-scoped, transacionais e seguros. PostgreSQL e `llm-config-service`
serão a fonte de verdade; o gateway Hebo continuará separado e não será usado
como API administrativa.

## Escopo

### Incluído

- Rotas protegidas de modelos configurados, providers, aliases e settings de
  modelo por UUID.
- Listagem, busca, filtro, criação, edição, ativação, desativação e exclusão
  de modelos provider-scoped.
- CRUD de providers, provider padrão único e bloqueio de exclusão com
  dependências.
- Cadastro, preservação, substituição e remoção explícita de credenciais
  cifradas conforme ADR-0007.
- Aliases manuais persistidos de forma relacional, com colisão, retarget e
  exclusão consistentes com o modelo alvo.
- Discovery de modelos por provider, diff e aplicação seletiva e idempotente
  no registry PostgreSQL.
- Probe administrativo de modelo, limitado e sanitizado, sem histórico.
- QueryClient isolado por request/instância, hidratação SSR, query keys
  estáveis e invalidações determinísticas.
- Taxonomia pública de erros e redaction antes de logs, traces e respostas.
- Correção da guarda client/server para a estrutura real do `apps/ui`.
- Reset limpo do banco e remoção de schema, dados e consumidores legados, sem
  migração, fallback ou suporte de compatibilidade.
- Correção da fixture de autenticação em `database/src/schema/app/auth.test.ts`
  como pré-requisito para a baseline de testes verde.
- TDD para toda mudança de comportamento.

### Não incluído

- Dashboard, analytics, logs, overview analítico e exclusão de logs de modelo.
- Health checks, status, latência ou streaming de saúde.
- Benchmarks e comparação de benchmarks.
- Agentes, roteamento de agentes, chat e histórico de conversa.
- `export-configs`, config-vs-registry, `merge`, `add-to-config` e sync de
  default settings legados.
- Portar `apps/web/src/shared/lib/api-client` ou reutilizar handlers Express.
- Inicializar, incorporar ou chamar o Hebo como API administrativa.
- OAuth OpenAI ou OAuth de qualquer outro provider.
- Remover o `apps/web` ou as rotas legadas antes do cutover do programa.

## Fluxo

### Entrada e navegação

1. O usuário acessa `/models`, `/models/providers`, `/models/aliases` ou
   `/models/$modelId/settings` dentro do layout protegido.
2. O `beforeLoad` existente valida a sessão. Sem sessão, redireciona para
   `/login?returnTo=<rota>` antes de consultar dados administrativos.
3. O loader garante somente os dados mínimos de entrada no cache da requisição
   SSR; a tela consome a mesma query hidratada sem emitir uma segunda fonte de
   verdade.
4. A navegação do shell passa a expor Models somente quando as rotas desta
   spec estiverem funcionais.
5. `viewer` enxerga os dados e estados de erro, mas não recebe controles de
   mutação. O servidor rejeita qualquer tentativa direta com `FORBIDDEN`.

### Modelos

1. A rota `/models` lista somente registros do registry PostgreSQL e apresenta
   UUID, `providerName/modelId`, display name, estado enabled, capacidades,
   custos, limites, aliases e `revision` pública.
2. Busca e filtros operam sobre dados públicos. Loading inicial, lista vazia,
   filtro vazio, falha recuperável e refetch são estados distintos.
3. Um admin cria um modelo escolhendo provider e `modelId`. O servidor valida
   o payload, impede duplicidade de `(providerId, modelId)` e retorna o UUID.
4. A rota `/models/$modelId/settings` carrega o aggregate por UUID. UUID
   inexistente mostra not found recuperável, sem tentar lookup por nome.
5. O admin salva metadados, capacidades, routing, request options e aliases em
   uma única mutação com a `revision` lida.
6. O servidor grava modelo e aliases em transação e incrementa a revisão.
   Revision obsoleta retorna `CONFLICT` com a revision atual e orienta recarga.
7. Ativar ou desativar também exige revision e invalida detalhe, lista e
   consumidores de catálogo afetados.
8. Excluir exige confirmação. Se houver alias ou outra dependência
   bloqueadora, retorna `CONFLICT`; nenhuma exclusão parcial ocorre.

### Providers e credenciais

1. `/models/providers` lista UUID, nome, adapter/provider, base URL, estado
   default, presença/estado de credencial, contagem de modelos e revision.
2. Reads nunca retornam plaintext, ciphertext, IV, tag, token parcial,
   fingerprint ou `secretRef`.
3. Criar provider exige nome único e um comando de credencial válido quando o
   adapter exigir autenticação. O segredo é cifrado antes do write.
4. Editar sem comando de segredo preserva o envelope sem descriptografá-lo.
   `replace` exige valor não vazio; `remove` é intenção explícita; string vazia
   é validação inválida, nunca remoção.
5. Tornar um provider default é uma operação transacional que limpa o default
   anterior e respeita a garantia de no máximo um default; zero defaults é
   válido. Na mesma release, `apps/server`, `packages/server`,
   `services/llm-gateway` e `apps/ui` passam a ler somente `is_default`.
6. Excluir provider com modelos retorna `CONFLICT` e `dependentModelCount`.
   Sem dependências, a exclusão remove também credenciais pertencentes ao
   provider, sem expô-las.
7. Envelope corrompido, chave ausente ou versão desconhecida falha fechado e
   retorna erro sanitizado; o sistema não apaga, sobrescreve ou interpreta o
   valor como plaintext.

### Aliases

1. `/models/aliases` lista aliases manuais e seus modelos alvo por UUID e nome
   provider-scoped.
2. Alias é normalizado por `trim`, Unicode NFKC e lowercase invariável, mas
   preserva a grafia escolhida para apresentação.
3. O servidor rejeita alias vazio, duplicado após normalização, igual a qualquer
   `modelId` normalizado ou à chave `providerName/modelId` normalizada de um
   modelo roteável, ou pertencente a outro modelo.
4. Rename ou troca de provider/modelId preserva o UUID do modelo e mantém os
   aliases apontando para o mesmo alvo.
5. O admin pode substituir o conjunto de aliases no save do aggregate com a
   `modelRevision` esperada. O save trava o aggregate e substitui a coleção na
   mesma transação.
6. Remover um alias individual exige `aliasId` e `aliasRevision`; conflitar um
   alias não altera o modelo ou outros aliases. Ambos os caminhos são
   transacionais e protegidos contra lost update.

### Discovery, sync e probe

1. O admin escolhe um provider com credencial utilizável e inicia discovery.
2. O servidor aceita somente origem HTTPS pública, sem redirects, userinfo ou
   IP literal. Antes de conectar, resolve DNS e bloqueia loopback, link-local,
   multicast, reservado e faixas privadas IPv4/IPv6. Origem HTTPS on-premise e
   portas fora de 443 só são aceitas quando a origem exata estiver em
   `PROVIDER_DESTINATION_ALLOWLIST`, configuração server-side não editável pela
   UI.
3. Discovery limita conexão a 3 segundos, duração total a 15 segundos, corpo a
   1 MiB e lista a 2.000 modelos. A credencial é descriptografada somente
   durante a chamada upstream.
4. A resposta pública contém modelos descobertos e um diff: `new`, `changed`,
   `unchanged` ou `conflict`, comparado pelo par provider/modelId.
5. O admin seleciona itens `new` ou `changed`; uma mutação idempotente aplica
   somente as seleções, valida revisões e retorna `created`, `updated`,
   `unchanged` e conflitos individualizados.
6. Repetir a mesma seleção com o mesmo estado não cria duplicatas nem altera
   revisões sem mudança material.
7. O probe aceita provider, modelo descoberto ou registrado e prompt de até
   1.024 caracteres Unicode. Não persiste conversa, usa os mesmos limites de
   destino e timeout do discovery, trunca a resposta pública a 8 KiB e nunca
   retorna corpo bruto de erro upstream.
8. Timeout, cancelamento, indisponibilidade e resposta inválida aparecem como
   estados distintos e permitem retry explícito.

## Contrato

### Rotas da UI

| Rota                        | Papel mínimo | Conteúdo                                         |
| --------------------------- | ------------ | ------------------------------------------------ |
| `/models`                   | `viewer`     | Lista e filtros de modelos configurados.         |
| `/models/providers`         | `viewer`     | Providers, credenciais públicas e discovery.     |
| `/models/aliases`           | `viewer`     | Aliases manuais e alvos provider-scoped.         |
| `/models/$modelId/settings` | `viewer`     | Configuração por UUID; edição apenas para admin. |

`$modelId` é sempre `model_proxy_models.id`. `providerName` e `modelId` são
dados editáveis e nunca identificadores de rota administrativa.

### Persistência e invariantes

- `model_proxy_models.provider_id` é obrigatório para registros do contrato
  novo e usa FK restritiva.
- `(provider_id, model_id)` possui unique index e não aceita duplicata.
- Modelos, providers e aliases expõem `revision` inteira, iniciada em `1` e
  incrementada somente em mudança material bem-sucedida.
- Updates usam `WHERE id = <id> AND revision = <expectedRevision>` dentro da
  transação; zero linhas atualizadas significa conflito, não not found, quando
  o UUID ainda existe.
- `model_proxy_providers.is_default` é a fonte única e possui garantia de no
  máximo um `true`.
- `model_proxy_settings.default_provider` e `defaultProvider` no contrato de
  modelo deixam de existir: o reset remove schema, dados e todos os leitores e
  writers legados; não há dual-write, fallback, migração ou compatibilidade.
- Aliases manuais são registros relacionais com `aliasNormalized` único,
  target por UUID, revision própria e FK restritiva. `aliasNormalized` não pode
  colidir com `modelId` nem `providerName/modelId` normalizados.
- O cutover começa com backup operacional e reset do banco. O deploy aplica o
  schema novo, recria dados exclusivamente pelos comandos novos e só então
  libera writers. Rollback restaura o snapshot pré-reset e os binários da
  release anterior; dados criados após o reset não são migrados de volta.
- O reset remove `secretRef`, aliases JSON, modelos sem provider e campos de
  default antigos em vez de convertê-los. Nenhuma credencial, alias ou modelo
  legado é reutilizado pelo contrato novo.

### DTOs públicos

`ModelSummary` e `ModelDetail` contêm somente campos de apresentação e
roteamento necessários: `id`, `providerId`, `providerName`, `modelId`,
`displayName`, `enabled`, capacidades, limites, pricing, request options,
aliases, timestamps e `revision`.

`ProviderPublic` contém `id`, `name`, `provider`, `baseUrl`, `isDefault`,
`hasStoredSecret`, `credentialStatus`, `modelCount`, timestamps e `revision`.
Ele não contém campos de segredo, mesmo com valor vazio.

`DiscoveryDiff` contém identificadores públicos, metadados upstream
normalizados, status do diff e revisão atual quando aplicável. Corpos upstream
brutos não atravessam a fronteira.

Tipos persistidos derivam do schema Drizzle conforme ADR-0006. DTOs são
transformações explícitas e testadas, não interfaces concorrentes de banco.

### Comandos de credencial

Inputs de create/update aceitam exatamente uma intenção:

- `preserve`: permitido somente em update e não lê o segredo atual;
- `replace`: recebe plaintext não vazio e cifra antes do write;
- `remove`: limpa o envelope explicitamente;
- create sem credencial só é aceito para adapter declarado sem autenticação.

O comando é server-only. Plaintext não integra query key, cache, log, retorno,
evento ou objeto de erro.

### Server functions e autorização

As operações são agrupadas por caso de uso e usam handlers puros com
dependências injetáveis. Cada adapter `createServerFn` valida Zod, obtém request,
executa `requireSession` e aplica `requireRole` antes de resolver banco,
credencial ou rede externa.

| Operação                              | Método   | Papel        | Garantia principal                            |
| ------------------------------------- | -------- | ------------ | --------------------------------------------- |
| list/get models                       | GET      | viewer       | DTO público por UUID; sem fallback legado.    |
| create/update/toggle/delete model     | POST     | admin        | Revision e transação; conflito tipado.        |
| list/get providers                    | GET      | viewer       | Nunca retorna material de segredo.            |
| create/update/default/delete provider | POST     | admin        | Credencial cifrada e dependências protegidas. |
| list/update/delete aliases            | GET/POST | viewer/admin | Alias normalizado e target por UUID.          |
| discover/apply sync                   | POST     | admin        | Rede server-side e aplicação idempotente.     |
| probe model                           | POST     | admin        | Limites, timeout e resposta sanitizada.       |

### Erros públicos

Toda operação retorna sucesso tipado ou:

```ts
type DomainError = {
  ok: false;
  error: {
    code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "VALIDATION"
      | "NOT_FOUND"
      | "CONFLICT"
      | "DESTINATION_BLOCKED"
      | "UPSTREAM_UNAVAILABLE"
      | "TIMEOUT"
      | "RATE_LIMITED"
      | "INTERNAL";
    message: string;
    retryable: boolean;
    fieldErrors?: Record<string, string[]>;
    currentRevision?: number;
    dependentModelCount?: number;
  };
};
```

`message` é segura para apresentação. Stack, SQL, headers, URL com secrets,
corpo remoto e material criptográfico nunca aparecem no envelope.

### Query, SSR e invalidação

- O QueryClient não é singleton de módulo entre requisições SSR.
- Loaders usam as mesmas query options e keys usadas pelos componentes.
- Keys incluem o domínio e IDs estáveis, por exemplo `models.list(filters)`,
  `models.detail(uuid)`, `providers.list()`, `aliases.list(filters)` e
  `discovery.diff(providerId)`.
- Mutations invalidam apenas listas/detalhes afetados; default, rename, sync e
  exclusão invalidam também dependentes declarados.
- Erro de refetch preserva o último dado válido e exibe falha recuperável.
- Dados administrativos de um request/sessão não podem aparecer em outro
  request por cache compartilhado.

### Fronteira client/server e observabilidade

- Componentes, hooks e query options client-safe não importam database,
  services, secrets, `node:*` ou implementações server-only.
- O `apps/ui` não contém `fetch` para `/models`, `/providers` ou outras rotas
  administrativas do `apps/server`.
- O boundary check cobre `src/features`, `src/shared`, `src/routes` e fixtures
  negativas de violação.
- Logging usa o logger compartilhado e redaction antes de serializar metadata.
- Eventos registram request ID, operação, actor ID, entidade, resultado, código
  seguro e duração; nunca payloads completos ou credenciais.

## Casos de borda

| #   | QUANDO o evento ocorrer                                               | o sistema DEVE responder                                                             |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Uma rota for acessada sem sessão                                      | Redirecionar para login antes de consultar o domínio.                                |
| 2   | Um viewer chamar uma mutação diretamente                              | Retornar `FORBIDDEN` sem executar write ou rede externa.                             |
| 3   | Dois providers usarem o mesmo `modelId`                               | Permitir registros distintos e identificá-los por UUID.                              |
| 4   | O mesmo provider receber `modelId` duplicado                          | Retornar `CONFLICT` sem criar outra linha.                                           |
| 5   | Um model create não possuir provider                                  | Retornar `VALIDATION`; não criar modelo órfão.                                       |
| 6   | A modelRevision enviada no save do aggregate estiver obsoleta         | Retornar `CONFLICT` com `currentRevision` sem sobrescrever dados ou aliases.         |
| 7   | O save de aliases falhar dentro do save de modelo                     | Reverter toda a transação e preservar a revision anterior.                           |
| 8   | Um provider com modelos for excluído                                  | Retornar `CONFLICT` com `dependentModelCount`.                                       |
| 9   | O provider default for substituído                                    | Trocar o default atomicamente e manter no máximo um registro default.                |
| 10  | Uma update omitir o comando de segredo                                | Preservar o envelope sem descriptografá-lo.                                          |
| 11  | Uma update enviar segredo vazio                                       | Retornar `VALIDATION`; não preservar, remover ou substituir implicitamente.          |
| 12  | A remoção de segredo for confirmada                                   | Limpar o envelope e marcar `hasStoredSecret=false` sem devolver o valor anterior.    |
| 13  | A cifra não puder ser aberta                                          | Falhar fechado com erro sanitizado, sem apagar nem tratar ciphertext como plaintext. |
| 14  | Um DTO ou log contiver campo sensível                                 | O teste de redaction/boundary deve falhar antes do merge.                            |
| 15  | Um alias colidir após normalização ou com chave de modelo roteável    | Retornar `CONFLICT` e preservar o conjunto anterior.                                 |
| 16  | Um alias apontar para modelo inexistente                              | Retornar `NOT_FOUND`; não persistir alias órfão.                                     |
| 17  | Um modelo com aliases mudar de nome/provider                          | Preservar os aliases pelo UUID alvo na mesma transação.                              |
| 18  | Discovery retornar lista vazia                                        | Mostrar estado vazio válido, sem tratar como falha.                                  |
| 19  | Discovery exceder 3 s de conexão, 15 s totais ou 1 MiB                | Cancelar e retornar `TIMEOUT` ou falha sanitizada retryable.                         |
| 20  | Discovery apontar para destino bloqueado pela política de rede        | Retornar `DESTINATION_BLOCKED` antes de enviar credencial ou request upstream.       |
| 21  | O mesmo sync for reaplicado sem diff material                         | Retornar unchanged, sem duplicata ou incremento de revision.                         |
| 22  | Um item de sync conflitar com revision atual                          | Aplicar somente itens independentes e reportar o conflito por item.                  |
| 23  | O probe receber prompt acima de 1.024 caracteres                      | Retornar `VALIDATION` antes da chamada upstream.                                     |
| 24  | O upstream devolver erro com corpo sensível                           | Retornar mensagem sanitizada e redigir logs.                                         |
| 25  | Um refetch falhar após dado válido                                    | Manter o dado anterior e apresentar erro recuperável.                                |
| 26  | Duas requisições SSR ocorrerem em sessões diferentes                  | Manter caches isolados sem vazamento entre respostas.                                |
| 27  | Um componente client importar código server-only ou chamar API legada | Fazer o boundary check falhar.                                                       |

## Questões em aberto

- Nenhuma questão bloqueia o planejamento.

## Estratégia de testes

- **Modo:** TDD obrigatório para mudanças de comportamento.
- **Arquivo de orientação:** `docs/context/testing-anti-patterns.md`.
- **Evidência:** cada task de comportamento registra o teste focado falhando
  pelo motivo esperado (RED), a implementação mínima e o mesmo teste passando
  (GREEN) antes de refatorar.
- **Runner:** Vitest para UI, services, repositories e guards; testes Drizzle
  usam o helper de banco definido pelo package responsável.
- **Exceções TDD:** documentos, regeneração de índices e alterações estáticas
  sem comportamento. Reset de schema e constraints exigem testes de schema
  antes da alteração, embora não sejam UI.

### Matriz principal

| ID  | Comportamento                            | Nível                       | Evidência esperada                                                                 |
| --- | ---------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| T1  | UUID e unique `(providerId, modelId)`    | schema/repository           | RED sem constraint/lookup; GREEN com dois providers e conflito no mesmo provider.  |
| T2  | Provider obrigatório e delete restritivo | schema/integration          | RED com órfão/SET NULL; GREEN com validação e conflito contado.                    |
| T3  | Default único                            | schema/service              | RED com dois defaults; GREEN com troca transacional.                               |
| T4  | Revision otimista                        | repository/service          | RED com overwrite; GREEN com `CONFLICT` e revision preservada.                     |
| T5  | Save atômico de modelo e aliases         | integration                 | RED com persistência parcial; GREEN com rollback integral.                         |
| T6  | Lifecycle de segredo                     | service/integration         | RED para retorno/ambiguidade; GREEN para create, preserve, replace e remove.       |
| T7  | Redaction e falha fechada                | unit/integration            | RED com material sensível; GREEN sem segredo em DTO, log ou erro.                  |
| T8  | Leitura viewer e mutação admin           | server function             | RED com viewer escrevendo; GREEN sem side effect e com código correto.             |
| T9  | Model CRUD provider-scoped               | server function/integration | RED com lookup por nome; GREEN por UUID, validação e invalidação.                  |
| T10 | Aliases normalizados                     | service/UI                  | RED para colisão/lost update; GREEN para lista, filtro, retarget e delete.         |
| T11 | Discovery seguro                         | service                     | RED para SSRF/timeout/corpo bruto; GREEN com validação, limites e erro sanitizado. |
| T12 | Diff e sync idempotente                  | service/integration         | RED com duplicata/revision espúria; GREEN com resultados por item.                 |
| T13 | Probe limitado                           | service/UI                  | RED com prompt/resposta ilimitados; GREEN com timeout, truncamento e retry.        |
| T14 | Reset limpo e baseline de auth           | schema/test                 | RED com dados legados e fixture obsoleta; GREEN com banco vazio e baseline verde.  |
| T15 | Query SSR isolada                        | SSR/integration             | RED com cache singleton; GREEN sem vazamento e sem fetch duplicado.                |
| T16 | Invalidação determinística               | query/UI                    | RED com dado stale; GREEN nas listas e detalhes afetados.                          |
| T17 | Estados de UI                            | component/route             | RED para vazio/erro/loading colapsados; GREEN para cada estado observável.         |
| T18 | Forms RHF/Zod                            | component                   | RED para payload inválido; GREEN com mensagens de campo e submit válido.           |
| T19 | Boundary client/server                   | static guard                | RED com fixtures proibidas; GREEN cobrindo features/shared/routes e API legada.    |
| T20 | Paridade útil com apps/web               | route/integration           | Passa para quatro superfícies e divergências aprovadas; exclui bugs e no-ops.      |

### Cenários de erro e compatibilidade

- Sessão ausente/expirada e papel insuficiente antes de banco ou rede.
- Validação Zod, UUID inexistente, duplicidade, revision stale e dependência.
- Chave ausente, envelope corrompido, replace/remove e redaction negativa.
- Alias duplicado, target inexistente e rollback de save composto.
- Destino bloqueado, timeout, cancelamento, rate limit e erro upstream sanitizado.
- Hidratação SSR, isolamento entre requests e erro de refetch com dado stale.
- Ausência de imports do `apps/web`, clientes HTTP legados e inicialização
  do gateway no bundle do `apps/ui`.

## Definition of Done

```bash
pnpm prettier --check docs/spec-decisions/0005_modelos_providers_roteamento_decisions.md docs/specs/0005-modelos-providers-roteamento-spec.md
# exit 0

pnpm docs-check
# exit 0; SPEC-0005 e ADR-0007 aparecem nos índices gerados

pnpm --filter ui test
# exit 0; matriz de rotas, server functions, Query SSR e UI verde

pnpm --filter ui typecheck
# exit 0

pnpm --filter ui build
# exit 0; bundles client/server sem imports proibidos

pnpm exec vitest run database/src
# exit 0; auth fixture, reset, constraints, FKs e revisions cobertos

pnpm --filter @lite-llm/llm-config-service test
# exit 0; modelos, providers, aliases, segredos, sync e probe verdes

pnpm verify -c
# exit 0; boundary e redaction sem violações

if rg -n "apps/web|shared/lib/api-client|localhost:3008|fetch\\([^)]*(/models|/providers)" apps/ui/src; then exit 1; fi
# exit 0; apps/ui não consome o legado
```

Critérios adicionais:

- Antes do dispatch, a baseline é executada em uma branch/worktree limpo e
  dedicado à SPEC-0005. Falha fora dos arquivos desta etapa não é dispensada:
  ela bloqueia o fechamento até ser corrigida pelo owner ou receber exceção
  explícita do usuário no relatório de verificação.
- A fixture incompatível em `database/src/schema/app/auth.test.ts` pertence ao
  primeiro lote desta etapa e precisa ficar verde antes de usar o comando de
  database como evidência de schema.
- Cada comportamento alterado possui evidência RED/GREEN no report da task.
- Nenhuma resposta, log, trace, erro, snapshot ou cache contém material de
  segredo.
- Reset limpo, criação de schema e rollback por restauração de snapshot foram
  exercitados; nenhum dado legado é migrado ou aceito.
- A matriz de roles prova ausência de side effects para `viewer`.
- A revisão humana aprova as quatro superfícies e as divergências intencionais
  em relação ao `apps/web`.

## Revisão humana

- Comparar visualmente modelos, providers, aliases e settings com o `apps/web`.
- Confirmar textos de exclusão, troca de default, remoção de segredo e conflito
  de edição concorrente.
- Validar discovery/sync/probe contra ao menos um provider real autorizado.
- Revisar o inventário de divergências: no-ops removidos, analytics/health/
  benchmarks/chat/OAuth adiados e URLs administrativas legadas não consumidas.
- Aprovar o reset limpo, backup operacional e restauração de snapshot antes de
  liberar writers do contrato novo.

## Verificação

```text
(preenchida no fechamento da Fase 7 com comandos e resultados reais)
```

## Self-Review

- **Verdict:** approved
- **Date:** 2026-07-13
- Placeholder scan: nenhum marcador de pendência ou seção incompleta.
- Consistência: identidade, default, secrets, revisions, aliases, roles, sync,
  reset limpo, query e boundary seguem o handoff aprovado e ADRs 0001–0007.
- Escopo: uma etapa coesa com foundation e três verticais acopladas; domínios
  posteriores permanecem explicitamente excluídos.
- Ambiguidade: entradas, saídas, estados, conflitos, edge cases, DoD e revisão
  humana estão decididos; não há questão bloqueadora.

## Spec Document Review Follow-up

- **Reviewer verdict:** corrigido antes do gate pós-escrita em 13 de julho de 2026.
- O cutover legado foi substituído por reset limpo, backup e rollback por
  snapshot; não há migração, fallback ou suporte a dados antigos.
- Todos os consumidores de default migram para `is_default` na mesma release;
  default é opcional.
- OAuth foi removido integralmente desta etapa.
- Aliases têm revision própria, enquanto saves completos usam `modelRevision`.
- Discovery e probe receberam política de destinos e limites numéricos
  verificáveis.
- A baseline de `database/src/schema/app/auth.test.ts` foi atribuída à etapa e
  qualquer outra falha externa bloqueia o fechamento ou requer exceção explícita.
