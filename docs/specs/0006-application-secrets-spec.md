---
status: accepted
date: 2026-07-14
builds-on:
  - ADR-0007
  - SPEC-0005
implemented-by: []
design-ref: docs/spec-decisions/0006_application_secrets_decisions.md
---

> Process: super-planning — Fase 2 (SPEC). Regras em
> `/home/gustavo/.agents/skills/super-planning/phases/02-spec.md`.

# Armazenar chaves de aplicação cifradas no banco

> Convenções compartilhadas: `docs/context/CONVENTIONS.md`,
> `docs/context/INFRA.md` e `docs/context/testing-anti-patterns.md`.
> Esta spec deriva as decisões de
> `docs/spec-decisions/0006_application_secrets_decisions.md`.

## Objetivo

Administradores poderão configurar as chaves de Artificial Analysis e
OpenRouter no painel protegido. O PostgreSQL será a única fonte de verdade;
os valores serão cifrados em repouso com `APP_ENCRYPTION_KEY` e recuperados
somente durante uma sincronização que realmente precise deles.

## Escopo

### Incluído

- Schema Drizzle e migration descartável para `application_secrets_store`.
- Serviço server-side para listar metadados, substituir, remover e resolver os
  dois segredos permitidos.
- Cifragem AES-256-GCM em envelope versionado usando `APP_ENCRYPTION_KEY`.
- Server functions e contratos Zod protegidos por sessão e papel `admin`.
- Rota `/models/secrets`, navegação e UI para status, salvar/substituir e
  remover explicitamente as chaves.
- Resolução dinâmica pelo banco nos syncs Artificial Analysis e OpenRouter.
- Remoção de `ARTIFICIAL_ANALYSIS_API_KEY` e `OPENROUTER_API_KEY` da validação
  de ambiente, exemplos e wiring de runtime.
- Cobertura TDD focada para persistência, segurança, autorização, UI e runtime.

### Não incluído

- Rotação ou múltiplas versões de `APP_ENCRYPTION_KEY`.
- Importação, bootstrap, migração ou fallback a variáveis de ambiente.
- Segredos arbitrários, credenciais de providers de modelos ou API keys locais
  do proxy.
- Auditoria de acesso, histórico de valores, exportação ou exibição parcial da
  chave.

## Modelo de dados e contrato

`application_secrets_store` terá `id` UUID, `key` texto único,
`credential_envelope` texto não nulo, `created_at` e `updated_at`. A tabela
usa as convenções das tabelas `model_proxy_*` existentes.

| Chave | Consumidor |
| --- | --- |
| `artificial_analysis_api_key` | Sincronização de benchmarks Artificial Analysis |
| `openrouter_api_key` | Sincronização de benchmarks OpenRouter |

O transporte recebe somente:

```ts
type ApplicationSecretPublic = {
  key: "artificial_analysis_api_key" | "openrouter_api_key";
  isConfigured: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};
```

O comando de escrita aceita plaintext apenas em uma server function
autenticada; ela valida texto não vazio, cifra antes do write e retorna somente
o DTO público. Remoção é explícita e retorna `isConfigured: false`. DTOs,
logs, erros, traces, métricas, loaders e cache nunca contêm plaintext,
envelope, IV, tag ou fingerprint.

## Fluxo

1. Um administrador abre `/models/secrets`; a server function valida sessão e
   papel antes de criar DB/service ou carregar qualquer segredo.
2. A página mostra os dois identificadores fixos e seu estado. `viewer` e
   usuário sem sessão não recebem nem a listagem de status.
3. Ao salvar, a função valida o input, o serviço cifra o valor com a chave
   derivada de `APP_ENCRYPTION_KEY` e faz upsert pela chave lógica.
4. A UI invalida a query e mostra apenas “configurada”, sem preencher de novo
   o campo do formulário.
5. A remoção exige confirmação explícita, apaga o registro e torna o estado
   “não configurada”.
6. Ao disparar um sync, o serviço resolve o segredo no banco, descriptografa-o
   no limite estrito da chamada e o envia ao runner. A alteração afeta o
   próximo sync, sem restart.
7. Registro ausente ou que não pode ser decifrado falha fechado com o código
   público legado `*_API_KEY_MISSING`. Erros do runner são reduzidos a uma
   mensagem segura e não propagam a chave para status ou resposta.

## Requisitos

- `APP_ENCRYPTION_KEY` continua sendo a única chave de criptografia.
- Nenhuma leitura ocorre fora do servidor ou antes da autorização.
- A UI usa componentes shadcn existentes, React Hook Form e schemas Zod.
- O runtime não lê `ARTIFICIAL_ANALYSIS_API_KEY` nem `OPENROUTER_API_KEY`.
- Códigos e mensagens públicos legados `*_API_KEY_MISSING` podem manter esses
  nomes por compatibilidade; eles não autorizam leitura de ambiente ou fallback.
- Ausência de chave não impede o servidor de iniciar; impede apenas o sync
  dependente quando acionado.
- O serviço é testável por injeção de repositório/runner sem APIs de produção
  criadas só para testes.

## Edge cases

| # | WHEN ⟨trigger⟩ | the system MUST ⟨response⟩ |
| --- | --- | --- |
| 1 | usuário sem sessão acessa função de segredos | retornar `UNAUTHENTICATED` antes de resolver DB ou serviço |
| 2 | usuário `viewer` lista ou altera segredos | retornar `FORBIDDEN` sem consultar ou decifrar valor |
| 3 | administrador salva whitespace ou plaintext vazio | retornar validação e não criar/alterar registro |
| 4 | administrador substitui chave existente | cifrar novo valor, substituir atomicamente o envelope e nunca retornar valores |
| 5 | administrador remove chave inexistente | retornar estado idempotente `isConfigured: false` |
| 6 | sync é acionado sem registro | falhar com código público legado `*_API_KEY_MISSING` sem chamar runner |
| 7 | envelope corrompido ou `APP_ENCRYPTION_KEY` ausente | falhar fechado; não retornar detalhe de cifra, envelope ou chave |
| 8 | dois admins salvam chaves diferentes | persistir ambas isoladamente por `key` |
| 9 | dois admins salvam a mesma chave | último upsert completo vence; nunca persistir plaintext |
| 10 | chave é substituída durante sync | sync em curso usa cópia já resolvida; próximo resolve valor novo |
| 11 | runner/upstream devolve mensagem contendo a chave | status e resposta retornam somente erro seguro, sem plaintext ou material derivado |

## Questões em aberto

Nenhuma. Os códigos públicos legados permanecem por compatibilidade, mas as
variáveis deixam de participar do contrato de ambiente e do runtime.

## Definition of Done

```bash
pnpm exec vitest run database/src/schema/model-proxy/schema-contract.test.ts # exit 0
pnpm --filter @lite-llm/llm-config-service exec vitest run src/services/__tests__/application-secrets.service.test.ts # exit 0
pnpm --filter ui exec vitest run src/features/model-admin/secrets/secrets-page.test.tsx src/features/model-admin/server/application-secrets.handlers.test.ts # exit 0
pnpm --filter server exec vitest run src/__tests__/benchmark-sync-application-service.test.ts src/__tests__/openrouter-benchmark-sync-application-service.test.ts # exit 0
! rg -n 'ARTIFICIAL_ANALYSIS_API_KEY|OPENROUTER_API_KEY' packages/config/src apps/server/src/runtime .env.example # exit 0
pnpm typecheck # exit 0
pnpm verify -c # exit 0
```

Os comandos devem passar; o schema deve ter tabela e índice único; os testes
devem provar RED/GREEN; e a busca limitada ao contrato de configuração/runtime
não pode encontrar as variáveis removidas. Códigos e mensagens públicos
legados são excluídos dessa busca.

## Test Strategy

- **Mode:** TDD para todas as mudanças de comportamento.
- **Guidance file:** `docs/context/testing-anti-patterns.md`.
- **Runner:** Vitest via comandos focados dos packages e `pnpm typecheck`.
- **RED/GREEN:** antes de cada vertical, criar teste observável que falha,
  implementar o mínimo e registrar execução verde na tarefa correspondente.

| ID | Comportamento | Nível | Evidência esperada |
| --- | --- | --- | --- |
| T1 | tabela exporta chave única e envelope não nulo | schema/unit | RED sem tabela; GREEN com contrato Drizzle |
| T2 | serviço cifra, faz upsert e retorna somente metadados | unit com fake | RED/GREEN sem plaintext no resultado |
| T3 | registro ausente ou envelope inválido falha fechado | unit | RED/GREEN e runner não chamado |
| T4 | handlers bloqueiam não autenticado e `viewer` antes do serviço | unit | RED/GREEN por ordem de chamadas |
| T5 | UI salva/remove e não exibe valor salvo | component | RED/GREEN com server functions mockadas |
| T6 | ambos os syncs resolvem chave no disparo | application/unit | RED/GREEN com runner recebendo valor resolvido |
| T7 | runner que ecoa chave não a expõe em status/rota | application/unit | RED/GREEN com mensagem segura |
| T8 | variáveis removidas não participam do runtime | config/runtime | busca limitada e bootstrap verdes |

## Human review

- Um administrador deve cadastrar chaves reais em ambiente controlado e
  confirmar que cada sync completa sem expor segredo em interface ou logs.
- Revisar o deploy para remover as duas variáveis sem remover
  `APP_ENCRYPTION_KEY`.

## Verification

Preenchido somente na transição para `implemented`, após todos os critérios de
Definition of Done passarem.

# Self-Review

**Verdict:** approved after independent review — 2026-07-14. A revisão
independente corrigiu a exceção dos códigos públicos legados, tornou os
comandos do DoD package-accurate e acrescentou a exigência testável de redigir
erros de runner. A especificação fixa a fonte única de verdade, o acesso
administrativo, o contrato de não exposição, a resolução em runtime e a
estratégia TDD; não há decisões abertas que bloqueiem o planejamento.
