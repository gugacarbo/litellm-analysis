---
status: draft
date: 2026-07-09
builds-on: [ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005]
implemented-by: []
---

# Recriar a aplicação web em TanStack Start por etapas

> Esta é a spec-mãe do programa de migração. Cada etapa deve possuir uma spec derivada aprovada antes de sua implementação. As specs derivadas detalham contratos de domínio sem redefinir as decisões arquiteturais registradas nas ADRs.

## Objetivo

Recriar o produto atualmente exposto por `apps/web` no `apps/ui`, usando TanStack Start como runtime da aplicação, com paridade funcional completa e sem dependência da API administrativa legada do `apps/server`.

Ao final do programa:

- `apps/ui` será a aplicação principal.
- Leituras, mutações, credenciais, OAuth, analytics e operações administrativas serão executadas por server functions ou APIs REST próprias do `apps/ui`, conforme o contrato de cada feature.
- TanStack Router e TanStack Query organizarão carregamento, cache, invalidação e mutações.
- Better Auth protegerá as operações administrativas com sessões persistidas e bootstrap por convite.
- O gateway Hebo continuará separado, dedicado ao tráfego de inferência e suas responsabilidades operacionais.
- `apps/web` e as rotas administrativas HTTP antigas poderão ser aposentados após a validação de paridade.

## Escopo do programa

### Incluído

- Fundação server/client do `apps/ui`.
- Autenticação, sessão e autorização.
- Composição server-side dos services e repositories existentes.
- Migração de modelos, providers e roteamento.
- Migração de dashboard, analytics, logs e estatísticas.
- Migração de health checks e seus estados de streaming.
- Migração de benchmarks, agentes e chat.
- Testes de paridade, segurança, bundling e regressão.
- Cutover do `apps/web` e aposentadoria progressiva das APIs administrativas.

### Não incluído

- Reescrever regras de negócio já presentes nos services e repositories.
- Expor banco, credenciais ou provedores ao browser.
- Integrar o gateway Hebo ao processo do TanStack Start.
- Introduzir TanStack DB como camada principal de estado.
- Remover `apps/web` antes da paridade funcional ser validada.

## Arquitetura alvo

O `apps/ui` será composto por três camadas explícitas:

1. **Client UI:** rotas, componentes, formulários e estados de apresentação sem acesso a módulos server-only.
2. **TanStack data layer:** loaders do Router para dados necessários à entrada da rota e TanStack Query para cache, refetch, mutações e invalidação.
3. **Server functions:** operações autenticadas que compõem `llm-config-service`, `models-service`, `analytics-service`, repositories e demais serviços necessários.

O gateway Hebo permanecerá em runtime separado. Ele continuará responsável por inferência, resolução de upstream, credenciais de provider e logging do tráfego de proxy. A UI não usará o gateway como API administrativa.

## Fluxo global

1. O usuário acessa uma rota do `apps/ui`.
2. O TanStack Router resolve a rota e carrega os dados essenciais por server functions.
3. A sessão Better Auth é validada no runtime server-side antes de qualquer operação protegida.
4. TanStack Query mantém o estado reativo da tela e chama apenas contratos server-side da aplicação.
5. Uma mutação executa a regra de negócio no servidor e invalida as queries afetadas.
6. A UI apresenta sucesso, erro, sessão expirada ou ausência de permissão como estados explícitos.
7. Chamadas a banco, gateway, providers, OAuth, streaming e arquivos permanecem fora do bundle client-side.

## Etapas

### Etapa 1 — Fundação e boundary server/client

**Objetivo:** provar que o `apps/ui` consegue hospedar server functions protegidas e acessar os serviços existentes sem contaminar a árvore client-side.

**Inclui:** contexto server-side, composição das factories existentes, TanStack Query/Router, Better Auth inicial, sessão, autorização mínima, uma server function de smoke test e guardas de bundling.

**Depende de:** ADR-0001, ADR-0002, ADR-0004 e ADR-0005.

**Saída obrigatória:** spec derivada aprovada, runtime funcional, autenticação testada e uma operação protegida de ponta a ponta.

### Etapa 2 — Modelos, providers e roteamento

**Objetivo:** migrar a configuração de modelos, providers, aliases, credenciais e roteamento para operações server-side do `apps/ui`.

**Inclui:** listagem, criação, edição, exclusão, sincronização, provider padrão, descoberta de modelos, OAuth de provider e configuração de rotas.

**Depende de:** Etapa 1 e ADR-0003.

**Saída obrigatória:** paridade dos fluxos administrativos de modelos e providers, sem consumo das rotas REST antigas pela UI.

### Etapa 3 — Dashboard, analytics e logs

**Objetivo:** migrar as superfícies de observabilidade e análise de uso.

**Inclui:** métricas, custos, tokens, distribuição, performance, logs, detalhes de requisição e ações relacionadas aos registros.

**Depende de:** Etapa 2 para filtros e contexto de modelos.

**Saída obrigatória:** consultas server-side com cache e invalidação verificáveis, incluindo estados vazios, filtros inválidos e falhas de consulta.

### Etapa 4 — Health checks e streaming

**Objetivo:** migrar health checks, status por modelo e atualizações contínuas sem WebSocket ou SSE implementados pelo browser.

**Inclui:** execução manual, resultados recentes, resumo, estados em progresso, sucesso, falha, timeout e reconciliação de atualizações.

**Depende de:** Etapa 2 e do contrato de streaming do gateway.

**Saída obrigatória:** streaming ou polling encapsulado no runtime server-side, com testes para eventos incompletos, duplicados e fora de ordem.

### Etapa 5 — Benchmarks, agentes e chat

**Objetivo:** migrar os fluxos de benchmarks, configuração de agentes e chat mantendo credenciais e chamadas de modelos no servidor.

**Inclui:** sincronização, comparação, aliases, configuração de agentes, catálogo, chat, ferramentas, streaming e histórico necessário.

**Depende de:** Etapas 1 a 4 e dos contratos de gateway/provedores.

**Saída obrigatória:** paridade funcional e cobertura dos estados de erro e streaming de cada fluxo.

### Etapa 6 — Cutover e aposentadoria

**Objetivo:** tornar o `apps/ui` a aplicação operacional principal e remover dependências administrativas obsoletas.

**Inclui:** auditoria de paridade, atualização de scripts e documentação, migração de deploy, descontinuação gradual do `apps/web` e remoção de rotas administrativas não utilizadas.

**Depende de:** todas as etapas anteriores.

**Saída obrigatória:** evidência de paridade, ausência de consumidores internos das APIs removidas e decisão explícita para cada rota HTTP remanescente.

## Contratos do programa

### Contrato de etapas

Cada etapa deve ter uma spec derivada em `docs/specs/` contendo:

- objetivo limitado à etapa;
- fluxos observáveis;
- contratos de entrada, saída e erro;
- casos de borda decididos;
- dependências e não objetivos;
- testes e Definition of Done executáveis;
- revisão humana necessária;
- referência à spec-mãe e às ADRs relevantes.

Uma etapa não começa implementação enquanto sua spec derivada não estiver aprovada.

### Contrato de dados

- Componentes client-side não acessam banco, secrets, filesystem, gateway ou providers.
- Operações administrativas usam server functions autenticadas.
- Query keys e invalidações são definidos por domínio.
- Respostas públicas não contêm credenciais ou tokens.
- Erros de sessão e autorização são distinguíveis de falhas de domínio.

### Contrato de rede

- O browser não consome a API administrativa legada do `apps/server`, nem acessa banco, credenciais, providers ou gateway diretamente.
- APIs REST próprias em `apps/ui/src/routes/api` são permitidas e devem ser autenticadas, validadas e documentadas.
- Streaming e integrações externas são iniciados no runtime server-side.
- A comunicação interna necessária às server functions do TanStack Start é aceita.

### Contrato de compatibilidade

- `apps/web` permanece funcional como referência até a paridade da etapa correspondente.
- O gateway Hebo permanece operável independentemente da migração da UI.
- Serviços e repositories existentes são a fonte de regra de negócio, salvo decisão posterior em ADR.
- Alterações de schema e migração de autenticação devem ser reversíveis durante a etapa em que forem introduzidas.

## Casos de borda

| # | QUANDO o evento ocorrer | o sistema DEVE responder |
| --- | --- | --- |
| 1 | Uma rota protegida for acessada sem sessão | Interromper a operação server-side e direcionar o usuário para autenticação, sem executar consulta administrativa. |
| 2 | A sessão expirar durante uma mutação | Rejeitar a mutação, preservar a consistência do banco e exibir estado de sessão expirada. |
| 3 | O usuário não tiver permissão para a operação | Retornar erro de autorização sem revelar dados protegidos ou detalhes de credenciais. |
| 4 | Um módulo server-only for importado pela árvore client-side | O build ou a guarda arquitetural DEVE falhar antes do merge. |
| 5 | Uma query falhar | A tela DEVE exibir erro recuperável e não substituir o último estado válido por dados inventados. |
| 6 | Uma mutação for concluída | As queries afetadas DEVEM ser invalidadas ou atualizadas de forma determinística. |
| 7 | `apps/web` e `apps/ui` divergirem durante a migração | A divergência DEVE ser registrada na spec derivada da etapa e resolvida antes do aceite da etapa. |
| 8 | O gateway Hebo estiver indisponível | A UI DEVE exibir falha operacional delimitada, sem expor segredos ou travar consultas que não dependem do gateway. |
| 9 | Um stream server-side terminar sem evento final | A operação DEVE ser marcada como incompleta/falha e permitir recuperação explícita. |
| 10 | Todas as etapas estiverem aprovadas | O cutover DEVE ocorrer somente após auditoria de paridade e inventário das APIs remanescentes. |

## Questões em aberto

- [ ] Nenhuma questão bloqueia a criação das specs derivadas. Detalhes de contrato específicos de cada domínio devem ser decididos na spec da etapa correspondente.

## Definition of Done

```bash
pnpm docs-check                         # exit 0; índices e documentos válidos
pnpm --filter ui typecheck              # exit 0 quando a fundação da UI existir
pnpm --filter ui test                   # testes da etapa corrente verdes
pnpm --filter ui build                  # build client/server sem imports proibidos
```

Critérios adicionais para fechar o programa:

- Cada etapa possui uma spec derivada aceita e um relatório de verificação.
- Cada caso de borda desta tabela é exercitado por teste ou auditoria referenciada na spec correspondente.
- A paridade funcional foi verificada por domínio.
- O browser não contém chamadas para a API administrativa legada do `apps/server`.
- O gateway Hebo continua validado por seus testes focados.
- `apps/web` e rotas administrativas antigas têm destino documentado.
- ADRs implementadas são atualizadas para `accepted` ou permanecem `proposed` quando a decisão ainda não foi exercitada.

## Revisão humana

- Aprovar a decomposição e a ordem das etapas.
- Revisar os fluxos administrativos de maior risco: credenciais, OAuth, roteamento e mutações destrutivas.
- Comparar visualmente a paridade das telas antes do cutover.
- Confirmar a política de bootstrap e autorização do primeiro ambiente.
- Aprovar a remoção de cada rota administrativa antiga.

## Verificação

```text
(preencher no fechamento do programa)
```
