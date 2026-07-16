---
status: accepted
date: 2026-07-16
builds-on: []
superseded-by: null
deciders: ["produto", "engenharia"]
---

# A auditoria administrativa usa eventos append-only separados dos agregados

## Contexto e problema

O painel protegido autoriza mutações administrativas por sessão e papel, mas
os agregados de modelos, providers, aliases e segredos não preservam quem
executou uma alteração, o que mudou ou qual requisição a originou. Adicionar
campos `createdBy` e `updatedBy` aos agregados mostraria apenas o último estado
e não atenderia criação, exclusão, substituição de segredo, falhas ou futuras
superfícies autenticadas por API key.

## Direcionadores da decisão

- Manter histórico cronológico consultável sem acoplar cada agregado a um
  esquema de autoria próprio.
- Propagar identidade somente depois de a fronteira server-side validar sessão
  e autorização.
- Nunca serializar plaintext, envelopes cifrados, tokens, cabeçalhos de
  autorização ou material derivado de segredo.
- Preparar a mesma base para UI, API legada e proxy, sem atribuir uma identidade
  de usuário a uma chamada que não a possui.
- Derivar modelos persistidos exclusivamente do schema Drizzle.

## Opções consideradas

### Opção 1 — Eventos de auditoria append-only separados

**Prós:** preserva todas as ações, evita poluir agregados, suporta múltiplos
tipos de ator e permite filtros futuros por ator, recurso e período.
**Contras:** adiciona um write e exige uma política central de redaction.

### Opção 2 — Campos `createdBy` e `updatedBy` em cada tabela

**Prós:** simples para responder quem criou ou alterou por último.
**Contras:** perde histórico, não representa exclusões/falhas e multiplica
colunas, FKs e regras de atualização.

### Opção 3 — Logs de aplicação como auditoria

**Prós:** não exige migration.
**Contras:** retenção e formato não são contratuais, logs podem ser perdidos e
não são uma consulta administrativa confiável.

## Decisão

O sistema terá `app_audit_events`, uma trilha de eventos de auditoria
append-only independente dos agregados administrativos. Cada evento carregará
o contexto confiável do ator (`actorType`, `actorId`, papel quando aplicável,
origem e `requestId`), ação, recurso, resultado e snapshots/metadados já
redigidos. O `actorId` é um identificador histórico e não dependerá de uma FK
que possa apagar a atribuição quando um usuário for removido.

O contexto será criado na fronteira que já executa `requireSession` e
`requireRole`; nenhuma identidade, papel, origem ou `requestId` vinda do
browser será aceita como verdade de auditoria. Escritas de auditoria usarão um
port/repository server-side e não exporão operações de update ou delete pela
aplicação. O schema Drizzle e a migration correspondente são a fonte do
contrato persistido.

Todo campo estruturado destinado ao evento passa por uma redaction profunda
antes de ser persistido, registrado no logger ou devolvido por um erro. A
política cobre valores e chaves de credenciais conforme ADR-0007; entradas
brutas de comandos não são snapshots de auditoria válidos.

A UI exporá uma consulta read-only em `/audit` somente para `admin`. A rota e
as server functions recusarão `viewer` antes de consultar o banco; a navegação
não exibirá o item para esse papel. A lista usará filtros explícitos e
paginação por cursor estável, ordenada por `occurredAt` e `id` decrescentes. Um
detalhe poderá mostrar exclusivamente a projeção pública já redigida; não há
exportação, edição ou remoção de eventos nessa entrega.

## Consequências

- `createdBy` e `updatedBy` permanecem opcionais para projeções de estado, mas
  não substituem a auditoria.
- A fundação entrega schema, tipos, contexto confiável, writer e query
  server-side, redaction e tela administrativa read-only; a instrumentação dos
  comandos existentes e a proteção da API legada são entregas posteriores da
  Epic #2.
- Um comando que venha a emitir evento de sucesso deve compartilhar transação
  com sua mutação de domínio. A semântica de uma falha ao escrever auditoria
  será fixada na spec da entrega que instrumentar a primeira mutação.
- A tabela não terá API de edição/remoção na aplicação. Evidência contra
  adulteração por operadores de banco, retenção/arquivamento e coleta de
  endereço IP/user-agent não são decididos por esta ADR.
- Eventos não guardam plaintext, ciphertext, IV, tag, token parcial,
  fingerprint, `Authorization`, `x-api-key`, cookies ou payloads upstream
  completos.

## Confirmação

```bash
pnpm exec vitest run database/src/schema/app/audit-events.test.ts
pnpm --filter @lite-llm/llm-config-service exec vitest run src/services/__tests__/audit-events.service.test.ts
pnpm --filter ui exec vitest run src/features/audit/server/audit-context.test.ts src/features/audit/audit-page.test.tsx
rg -n "credentialEnvelope|apiKey|accessToken|refreshToken|authorization|x-api-key" \
  database/src/schema/app/audit-events.ts services/llm-config-service/src apps/ui/src/features/audit \
  --glob '*.ts' --glob '*.tsx'
```

Os testes devem provar que o writer só aceita um contexto confiável,
snapshots/metadados não persistem os valores sensíveis injetados pelos casos de
teste e `viewer` não chega à query da UI. A busca é revisada para garantir que
esses nomes existem apenas na política de redaction e nos testes negativos,
nunca como valores emitidos.

## Notas

As decisões de retenção, exportação e integração com as rotas Express serão
tratadas nas entregas filhas próprias da Epic #2.
