---
status: draft
date: 2026-07-16
builds-on:
  - ADR-0008
  - ADR-0007
  - SPEC-0005
implemented-by: []
---

# Estabelecer a fundação server-side da auditoria administrativa

> Convenções compartilhadas: `docs/context/CONVENTIONS.md`. Esta spec aplica
> ADR-0008 sem transformar o log de requests do proxy em auditoria
> administrativa.

## Objetivo

O monorepo terá uma fundação server-side para registrar eventos administrativos
sanitizados e atribuídos a um ator confiável, além de uma tela read-only para
administradores consultarem essa trilha. A entrega não instrumenta ainda os
comandos de modelos, providers, aliases, segredos, convites ou API legada; ela
cria o contrato que essas entregas deverão usar.

## Escopo

### Incluído

- Schema Drizzle, tipos derivados, migration e índices para `app_audit_events`.
- Port/repository e writer server-side append-only, testáveis por injeção.
- `AuditContext` criado somente após a autenticação/autorização no `apps/ui`.
- Redaction profunda de snapshots e metadados antes de persistência ou logger.
- Query paginada server-side, detalhes públicos redigidos e filtros por período,
  ator, ação, tipo de recurso e resultado.
- Rota `/audit`, item de navegação visível somente a `admin` e tela read-only
  com lista, filtros, estados vazio/erro/retry, paginação e detalhe.
- Testes de schema, writer/query, redaction, proveniência do contexto e acesso
  administrativo da UI.

### Não incluído

- Instrumentar operações administrativas existentes.
- Alterar campos dos agregados para `createdBy`/`updatedBy`.
- Proteger ou migrar as rotas Express legadas.
- Auditoria de chamadas LLM, telemetria de uso, retenção, arquivamento,
  exportação ou exclusão de eventos.
- Coletar IP, user-agent, cookies, cabeçalhos ou dados de geolocalização.

## Fluxo

1. A server function obtém a requisição, valida sessão e papel antes de criar
   qualquer serviço de domínio, conforme SPEC-0005.
2. Somente depois dessa validação ela cria `AuditContext` com ator `user`, ID
   do usuário autenticado, papel efetivo, origem `ui` e um `requestId` gerado
   pelo servidor.
3. Um comando administrativo futuro fornece esse contexto ao writer junto com
   ação, recurso, resultado e uma projeção deliberadamente pequena do antes,
   depois ou metadados.
4. O writer redige recursivamente a projeção e persiste apenas a forma
   sanitizada em `app_audit_events`; ele não possui update ou delete.
5. Um admin acessa `/audit`; a rota, a query e o detalhe exigem `admin` antes
   de resolver repositório. O `viewer` não recebe item de navegação nem dados.
6. A tela inicia com os eventos mais recentes e permite filtrar por período,
   `actorId`, ação, tipo de recurso e resultado. Filtros e cursores integram a
   query key e a URL, para que recarregar ou compartilhar a URL preserve a
   consulta sem compartilhar cache entre requisições.
7. A lista usa paginação por cursor de `(occurredAt, id)` em ordem decrescente;
   os controles Anterior/Próximo mudam somente dentro do conjunto filtrado.
8. Ao abrir o detalhe, a UI mostra somente o DTO público redigido. Estado vazio,
   filtro sem resultado e erro recuperável são distintos.
9. Nesta entrega, testes de integração do writer e query demonstram o contrato
   sem conectar ainda uma mutação de produção.

## Contrato

O evento persistido terá, no mínimo:

```ts
type AuditEvent = {
  id: string;
  occurredAt: Date;
  actorType: "user" | "api_key" | "system";
  actorId: string | null;
  actorRole: "admin" | "viewer" | null;
  source: "ui" | "legacy_api" | "proxy" | "system";
  requestId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  outcome: "success" | "failure" | "denied";
  before: unknown | null;
  after: unknown | null;
  metadata: unknown | null;
};
```

`before`, `after` e `metadata` são JSONB somente depois de `redactAuditData`.
O redactor deve criar uma cópia, manter a estrutura útil para consulta e
substituir por `[REDACTED]` qualquer valor associado, em qualquer nível, a
`authorization`, `cookie`, `set-cookie`, `x-api-key`, `apiKey`,
`credentialEnvelope`, `accessToken`, `refreshToken`, `idToken`, `password`,
`secret`, `token`, `keyHash`, `iv`, `tag` ou variantes normalizadas dessas
chaves. Strings contendo um bearer token ou uma chave no padrão conhecido
também são redigidas. Objetos não serializáveis, erros e request/response
brutos não são aceitos como snapshots.

`AuditContext` não aceita campos de ator do input público. Na UI ele nasce da
sessão retornada por `requireSession`; os tipos `api_key` e `system` existem
para as próximas entregas, que deverão criar contexto equivalente em suas
fronteiras autenticadas.

A consulta administrativa recebe somente:

```ts
type AuditEventListInput = {
  start?: string; // ISO-8601 inclusivo
  end?: string; // ISO-8601 inclusivo
  actorId?: string;
  action?: string;
  resourceType?: string;
  outcome?: "success" | "failure" | "denied";
  cursor?: string; // opaco; representa (occurredAt, id)
  direction?: "older" | "newer";
  pageSize?: number; // 1..100; default 50
};

type AuditEventListResult = {
  events: AuditEventPublic[];
  olderCursor: string | null;
  newerCursor: string | null;
};
```

`AuditEventPublic` contém os campos identificadores e temporais de `AuditEvent`
e, no detalhe, somente `before`, `after` e `metadata` já redigidos. A lista
não retorna esses três campos. `cursor` é opaco para a UI e o servidor valida a
tupla decodificada antes de usá-la. `start` posterior a `end`, cursor inválido,
data inválida, filtro acima do limite de tamanho ou `pageSize` fora do intervalo
retorna `VALIDATION` antes do repository. A resposta não contém
email, nome, IP, user-agent, cookies, sessões, headers ou segredo.

A rota `/audit` valida os filtros da URL e prefetches a mesma query usada pelo
componente. Ela redireciona `viewer` para `/` antes do loader; a server function
repete `requireSession` e `requireRole("admin")`, devolvendo `UNAUTHENTICATED`
ou `FORBIDDEN` antes de resolver banco. A navegação recebe o papel da sessão e
oculta Audit para `viewer`; ocultar o link não substitui essas verificações.

## Casos de borda

| #   | QUANDO ⟨gatilho⟩                                                                                | o sistema DEVE ⟨resposta⟩                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | uma chamada sem sessão ou sem papel suficiente tentar criar contexto                            | recusar antes de resolver o writer ou banco                                                                                  |
| 2   | o browser enviar `actorId`, `role`, `source` ou `requestId`                                     | ignorar o valor; o contexto vem apenas do servidor                                                                           |
| 3   | snapshot ou metadata contiver segredo em objeto aninhado, array ou string bearer                | persistir `[REDACTED]` e nunca o material original                                                                           |
| 4   | um evento referenciar usuário removido depois                                                   | preservar o `actorId` histórico e o evento                                                                                   |
| 5   | código de aplicação tentar atualizar ou remover evento                                          | não expor método no port/repository e não criar rota correspondente                                                          |
| 6   | a serialização receber `Error`, `Request`, `Response`, `Headers`, função ou referência circular | rejeitar o evento antes do write, sem registrar o objeto bruto                                                               |
| 7   | futuro comando de sucesso emitir evento e mutação no mesmo caso de uso                          | a implementação desse comando usará a mesma transação para domínio e auditoria                                               |
| 8   | um `viewer` abrir `/audit` ou chamar listagem/detalhe diretamente                               | redirecionar na rota e retornar `FORBIDDEN` pela server function antes de consultar o banco                                  |
| 9   | um admin filtrar eventos, avançar/voltar página ou recarregar a URL                             | manter filtros na URL, ordenar deterministicamente por `(occurredAt, id)` e não repetir/perder evento na fronteira do cursor |
| 10  | não houver evento ou nenhum evento corresponder ao filtro                                       | mostrar empty-state distinto, sem tratar como falha                                                                          |
| 11  | query ou detalhe falhar de modo recuperável                                                     | manter filtros, mostrar erro seguro e oferecer retry sem expor dados internos                                                |
| 12  | administrador abrir detalhe de um evento                                                        | mostrar somente o DTO público redigido, sem valor original em DOM, payload de server function ou erro                        |

## Questões em aberto

- [ ] Qual é a retenção, arquivamento e expurgo dos eventos, inclusive backups?
- [ ] A garantia append-only precisa de trigger/permissões no PostgreSQL contra
      `UPDATE`/`DELETE` por credenciais operacionais, ou o contrato de
      aplicação é suficiente para a primeira release?
- [ ] IP e user-agent devem ser coletados? Se sim, qual base legal, janela de
      retenção e quem pode consultá-los?
- [ ] Quando o primeiro comando instrumentado não conseguir gravar o evento,
      a mutação deve falhar junto (audit obrigatório) ou ter reconciliação?
- [ ] A leitura de `/audit` e de um detalhe deve gerar evento `audit.read`? Se
      sim, qual mecanismo evita recursão e ruído na própria trilha?

## Definition of Done

```bash
pnpm exec vitest run database/src/schema/app/audit-events.test.ts # exit 0; casos 4 e 5
pnpm --filter @lite-llm/llm-config-service exec vitest run src/services/__tests__/audit-events.service.test.ts # exit 0; casos 3, 5, 6, 7 e 9
pnpm --filter ui exec vitest run src/features/audit/server/audit-context.test.ts src/features/audit/server/audit.handlers.test.ts src/features/audit/audit-page.test.tsx # exit 0; casos 1, 2, 8 e 10-12
pnpm typecheck # exit 0
pnpm verify -c # exit 0
```

## Revisão humana

- Validar que o detalhe do evento continua útil para investigação sem expor
  valores confidenciais, em viewport desktop e estreita.
- Aprovar as cinco questões abertas antes de instrumentar uma mutação de
  produção.

## Verificação

```text
(preencher no fechamento)
```
