# Inventário e backlog de migração: `apps/web` → `apps/ui`

> Foto feita em 12 de julho de 2026. O `apps/web` é a referência funcional do
> produto antigo; o `apps/ui` é o novo app TanStack Start. Os checkboxes deste
> documento são o controle de decisão e migração — não significam que algo do
> `web` já esteja presente no `ui`.

## Estado atual

| Aplicação  | Papel                                                   | Estado                                           |
| ---------- | ------------------------------------------------------- | ------------------------------------------------ |
| `apps/web` | SPA administrativa legada, React + Vite + React Router. | Referência funcional atual.                      |
| `apps/ui`  | Novo app SSR, TanStack Start + React + Vite.            | Fundação, autenticação e shell protegido mínimo. |

O `web` recebe dados e executa ações no backend por `/api/*` e recebe eventos
de monitoramento em `ws(s)://<host>/ws/monitor`. O `ui` ainda não possui essas
integrações de produto.

## Fundação já existente no `ui`

- [x] TanStack Start, Router por arquivos, React Query, Tailwind/shadcn e fonte Geist.
- [x] Login por e-mail e senha via Better Auth + Postgres/Drizzle.
- [x] Convites de usuário com token hash, uso único e expiração de 7 dias.
- [x] Papéis `admin` e `viewer`; a rota `/` atual exige `admin`.
- [x] Script de primeiro admin: `pnpm --dir database db:bootstrap-admin`.
- [x] Shell autenticado SSR-safe: sidebar desktop recolhível, cabeçalho e drawer mobile transitório acessível.
- [x] Preferências de tema e sidebar desktop persistem em cookies validados; o tema da primeira visita é resolvido antes da pintura.
- [x] Navegação inicial contém somente Dashboard (`/`), sem links para áreas ainda não migradas.
- [x] Menu de conta mostra somente nome, e-mail e papel; o sign-out usa o cliente oficial do Better Auth e mantém erro recuperável.
- [ ] Substituir o dashboard-placeholder pelo primeiro domínio escolhido abaixo.
- [ ] Definir a estratégia para o `ui` acessar o backend: server functions/BFF do TanStack Start, proxy HTTP para `apps/server`, ou ambos.
- [ ] Aplicar autenticação/autorização a todas as rotas migradas; o `web` não possui guarda de rota no cliente.

## Navegação e rotas do `web`

| Área                    | Rotas no `web`                                                                       | O que a pessoa faz                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Dashboard               | `/`                                                                                  | Visualiza uso, custo, performance e insights agregados.                                             |
| Logs                    | `/logs`, `/logs/:requestId`, `/logs/:requestId/chat`                                 | Pesquisa chamadas, vê o detalhe de uma requisição e simula/conversa a partir dela.                  |
| Estatísticas de modelos | `/model-stats`                                                                       | Compara modelos e remove os logs de um modelo.                                                      |
| Agentes                 | `/agents`, `/agents/:id`                                                             | Cria, edita e remove agentes e categorias de roteamento.                                            |
| Modelos                 | `/models/configured`, `/models/providers`, `/models/health-check`, `/models/aliases` | Configura modelos, providers, health checks e aliases. `/models` redireciona para `configured`.     |
| Detalhe de modelo       | `/models/:modelName/{settings,overview,logs}`                                        | Edita configuração, vê analytics e filtra logs de um modelo.                                        |
| Benchmarks              | `/benchmarks/aa`, `/benchmarks/openrouter`                                           | Consulta, filtra e sincroniza os dois catálogos de benchmarks. `/benchmarks` redireciona para `aa`. |
| Compatibilidade         | `/model-stats/:modelName`                                                            | Redireciona para o detalhe equivalente em `/models/:modelName`.                                     |

O layout comum do `web` tem sidebar recolhível, cabeçalho, filtro global de
data, toasts, tema, tratamento de erro por rota e um chat flutuante disponível
em todo o app.

## Backlog por domínio

### 1. Shell, navegação e experiência transversal

- [ ] Migrar o shell: sidebar recolhível, cabeçalho e breadcrumb/nome do modelo ativo.
- [ ] Migrar o filtro global de intervalo de datas e decidir quais rotas o consomem.
- [ ] Migrar `ThemeProvider` (tema claro/escuro) e a preferência persistida.
- [ ] Migrar toasts, error boundaries e estados de carregamento/empty state usados nas páginas.
- [ ] Criar uma biblioteca de componentes no `ui` apenas a partir dos componentes realmente escolhidos; o `web` possui uma biblioteca shadcn/Radix ampla.

### 2. Dashboard de analytics

**No `web`:** cards de resumo e insights; gráficos de gasto diário, distribuição
por modelo e tokens, padrão por hora, modelos, eficiência, custo por token,
tendências e rankings por API key/usuário. O filtro global de data altera as
consultas.

**Dados consumidos:** `/api/metrics`, `/api/analytics/tokens`,
`/api/analytics/performance`, `/api/analytics/temporal`,
`/api/analytics/keys`, `/api/analytics/cost-efficiency`,
`/api/analytics/token-trend` e `/api/analytics/model-stats`.

- [ ] Decidir se o dashboard entra no primeiro corte do `ui`.
- [ ] Migrar cards de overview e insights calculados.
- [ ] Migrar gráficos de uso/modelos/eficiência e tabelas de top entidades.
- [ ] Portar o contrato de filtros de data e cache/invalidação das queries.
- [ ] Escolher uma biblioteca de gráficos; o `web` usa Recharts.

### 3. Logs de requisições e gasto

**No `web`:** tabela paginada de logs de chamadas, ordenada do mais recente
para o mais antigo, com resumo, colunas configuráveis, agrupamento por modelo,
filtro global de período, refresh manual e auto-refresh de 5 segundos. Cada
linha abre detalhes de payload/resposta, métricas, custos, erros e badges. Uma
rota adicional permite simular/conversar a partir de um log.

**Dados consumidos:** `/api/spend/logs`, `/api/spend/logs/:requestId`, além de
agregados de `/api/spend/model`, `/api/spend/user` e `/api/spend/trend`.

- [ ] Decidir se a listagem de logs é MVP do novo app.
- [ ] Migrar tabela, paginação, resumo e filtros antes do detalhe.
- [ ] Migrar detalhe de log, visualização de JSON/payload e métricas.
- [ ] Decidir se a simulação de chat por log ainda faz sentido e, se sim, migrá-la.
- [ ] Definir a política de polling/atualização em tempo real; não copiar o intervalo de 5 segundos sem necessidade.

### 4. Estatísticas agregadas por modelo

**No `web`:** tabela comparativa de modelos com ordenação, busca, colunas
ocultáveis, cards de resumo, mini-gráficos e rankings. Também permite apagar os
logs associados a um modelo após confirmação.

**Dados consumidos:** agregados de analytics/spend e ação de remoção em
`/api/models/logs/:modelName`.

- [ ] Decidir se esta área continua separada do detalhe de modelo ou será absorvida pelo dashboard/modelos.
- [ ] Migrar a tabela e seus KPIs caso seja mantida.
- [ ] Migrar a exclusão de logs somente após definir permissões e confirmação/auditoria.

### 5. Catálogo, configuração e roteamento de agentes

**No `web`:** lista de agentes e categorias, CRUD de ambos, editor de agente
com seções geral, modelo, ferramentas e opções avançadas. O detalhe
`/agents/:id` também é usado para criar um agente novo (`/agents/new`).

**Dados consumidos:** `/api/agent-catalog/:id` e `/api/category-catalog/:key`.

- [ ] Decidir se agentes e categorias pertencem ao novo produto.
- [ ] Migrar leitura/lista e navegação para detalhe.
- [ ] Migrar editor de agente e validação do formulário.
- [ ] Migrar CRUD de categorias e comportamento de roteamento associado.
- [ ] Manter os tipos do browser sem importar repositórios/runtime Node no cliente.

### 6. Gestão de modelos configurados

**No `web`:** lista de modelos com status de health check, criação/edição,
habilitar/desabilitar, remoção local da configuração, formulário com opções de
roteamento, raciocínio e parâmetros extras. Também exporta configurações e
oferece uma sincronização em lote: mostra divergências entre fonte/configuração
local e banco, permite selecionar campos e aplica as escolhas.

**Dados consumidos:** `/api/models`, `/api/models/with-config`,
`/api/models/export-configs`, `/api/models/sync-diff`,
`/api/models/sync-batch`, `/api/models/add-to-config`, `/api/models/merge`,
`/api/models/default-settings-diff` e `/api/models/sync-default-settings`.

- [ ] Decidir o modelo de fonte de verdade para configurações (banco, arquivo gerado ou ambos).
- [ ] Migrar primeiro listagem e status; depois criação/edição.
- [ ] Migrar sync/diff em lote apenas mantendo a semântica atual: apagar pela UI é local à configuração; remoção do banco é responsabilidade do Sync.
- [ ] Migrar exportação de configuração se ela continuar necessária.
- [ ] Migrar preferências/default settings de provider e o aviso de drift.

### 7. Detalhe de modelo

**No `web`:** para cada modelo há três abas:

| Aba        | Conteúdo                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Settings` | Formulário de configuração e comparação com benchmarks para importar campos mapeáveis, como display name, família, API mode, visão e custos. |
| `Overview` | Cards e gráficos de gasto, tendência, latência, TTFT, eficiência de token, status/erros, provider, consumo horário, API keys e usuários.     |
| `Logs`     | Logs paginados já filtrados pelo modelo.                                                                                                     |

- [ ] Definir se o detalhe será a tela central de gestão ou uma área posterior à listagem.
- [ ] Migrar `Settings` depois do formulário base de modelos.
- [ ] Migrar `Overview` usando o mesmo contrato de analytics do dashboard.
- [ ] Migrar `Logs` reutilizando a tabela/detalhe de logs, não duplicando a implementação.
- [ ] Migrar a comparação/importação de benchmark somente após os dois catálogos estarem presentes.

### 8. Providers e credenciais

**No `web`:** CRUD de providers para o proxy; os segredos são informados no
formulário, criptografados no servidor e nunca são exibidos outra vez. É
possível escolher um provider padrão, descobrir modelos, testar chat, registrar
modelos descobertos e administrar OAuth de OpenAI por device flow (iniciar,
acompanhar, cancelar e desconectar).

**Dados consumidos:** `/api/providers`, `/api/providers/default`,
`/api/providers/:name/discover-models`, `/api/providers/:name/test-chat`,
`/api/providers/:name/register-models` e os equivalentes
`/api/providers/openai-oauth/*`.

- [ ] Definir se o novo app administra credenciais do proxy ou se isso migra para outra superfície.
- [ ] Migrar CRUD sem nunca devolver o segredo ao cliente.
- [ ] Migrar provider padrão e descoberta/registro de modelos.
- [ ] Migrar teste de chat por provider.
- [ ] Migrar OAuth device flow e seus estados assíncronos somente se o provider OpenAI continuar suportado.

### 9. Aliases de modelos

**No `web`:** lista aliases manuais de roteamento, busca por alias, filtra pelo
modelo destino e remove aliases. O editor de modelo também gerencia aliases do
modelo atual.

**Dados consumidos:** `/api/models/aliases`, `/api/models/:modelName/aliases`
e `/api/models/aliases/:alias`.

- [ ] Decidir se aliases ficam em uma tela global, no detalhe do modelo ou nos dois lugares.
- [ ] Migrar listagem/filtro e remoção.
- [ ] Migrar criação/edição dentro do formulário de modelo, se mantida.

### 10. Health checks em tempo real

**No `web`:** mostra a saúde mais recente por modelo, percentuais e histórico
paginado; permite rodar health check global ou individual. Ao abrir a tela,
consulta latest/summary/history e abre WebSocket para atualizar execuções,
deltas de streaming, resultado final, rejeições e detalhes de
request/response.

**Dados consumidos:** `/api/health-check/latest`, `/api/health-check/summary`,
`/api/health-check/results`, `POST /api/health-check/run` e
`/ws/monitor`.

- [ ] Decidir se monitoramento/health check faz parte do primeiro lançamento do `ui`.
- [ ] Migrar tabela de estado e histórico HTTP.
- [ ] Migrar WebSocket com reconexão exponencial e atualização incremental.
- [ ] Migrar execução global/individual e detalhe do stream/payload.
- [ ] Preservar a distinção entre polling de leitura e gatilhos reais de health check; recarregar a página não deve disparar um teste.

### 11. Benchmarks

**No `web`:** duas fontes independentes, Artificial Analysis (`/benchmarks/aa`)
e OpenRouter (`/benchmarks/openrouter`). Ambas mostram estado da sincronização,
fonte/link/data, busca, filtros de provider/inteligência/preço, ordenação e
paginação. A visão AA inclui filtro de modelos locais, seleção, comparação de
até três modelos, métricas/radar e aliases de benchmark.

**Dados consumidos:** `/api/benchmarks/models`, `/api/benchmarks/sync-status`,
`/api/benchmarks/sync`, `/api/benchmarks/aliases`,
`/api/benchmarks/openrouter/models`, `/api/benchmarks/openrouter/sync-status`
e `/api/benchmarks/openrouter/sync`.

- [ ] Definir quais fontes de benchmark continuam no produto.
- [ ] Migrar listagem/filtros/sincronização da primeira fonte escolhida.
- [ ] Migrar comparação visual e seleção de modelos, caso seja necessária.
- [ ] Migrar aliases de benchmark, se o matching manual ainda for necessário.
- [ ] Integrar benchmark ao formulário de modelo somente após a listagem estar estável.

### 12. Chat flutuante

**No `web`:** botão disponível em todo o layout; seleciona um modelo habilitado
e abre uma conversa em modal com `assistant-ui`. O transporte chama
`POST /api/chat` com `config.modelName`; as mensagens podem renderizar
Markdown, ferramentas, raciocínio e código destacado.

- [ ] Decidir se chat operacional é parte do novo app ou uma ferramenta separada.
- [ ] Migrar seletor de modelos habilitados.
- [ ] Migrar transporte e contrato de `/api/chat`.
- [ ] Migrar renderização de thread/ferramentas/raciocínio somente se o backend ainda entregar esse protocolo.

## Dependências e contratos a preservar por decisão

| Capacidade do `web`   | Principais blocos atuais      | Decisão para o `ui`                                                        |
| --------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| Dados/cache           | TanStack React Query          | [ ] Reutilizar contratos de query keys e invalidação onde fizer sentido.   |
| Tabelas               | TanStack Table                | [ ] Adotar somente ao migrar logs/modelos/stats.                           |
| Gráficos              | Recharts                      | [ ] Adotar somente ao migrar analytics/benchmarks.                         |
| Formulários de schema | RJSF + AJV                    | [ ] Manter somente se algum editor continuar schema-driven.                |
| Chat                  | assistant-ui + AI SDK         | [ ] Manter somente se o chat flutuante for aprovado.                       |
| Tempo real            | WebSocket `/ws/monitor`       | [ ] Portar como hook/client isolado para health checks.                    |
| Componentes           | shadcn, Radix, Lucide, Sonner | [ ] Importar/adicionar sob demanda, não copiar toda a biblioteca do `web`. |

## Organização de código que vale manter

- [x] No `web`, cada domínio mora em `src/features/<domínio>/`, com componentes,
      hooks, tipos e utilitários próximos; novas áreas do `ui` devem seguir esse
      padrão, adaptado às rotas TanStack Start.
- [x] O cliente HTTP do `web` está separado por domínio em
      `src/shared/lib/api-client/`; manter uma fronteira equivalente para não
      espalhar chamadas ao backend pelos componentes.
- [x] Tipos de browser são espelhos leves de contratos de servidor; não importar
      código Node/repositórios para o bundle de cliente.
- [ ] Definir como os server functions do `ui` convivem com esse cliente HTTP e documentar a regra antes da primeira migração.

## Verificações desta revisão

- [x] Foram mapeadas todas as rotas funcionais e redirects declarados no router do `web`, agrupados nos 12 domínios acima.
- [x] Foram identificados os contratos HTTP e o WebSocket que cada domínio depende.
- [x] O `web` possui 24 arquivos de teste (`*.test.ts(x)` ou `*.spec.ts(x)`) no código-fonte.
- [ ] Ao escolher um domínio, converter a linha correspondente deste backlog em tarefas menores e migrar testes relevantes junto com a UI.

## Ordem inicial sugerida para decisão

1. [ ] Escolher entre **Modelos/Providers**, **Logs** ou **Dashboard** como primeiro domínio de produto.
2. [ ] Definir a fronteira entre TanStack Start e a API/WebSocket existentes.
3. [ ] Migrar o shell mínimo e apenas os componentes necessários ao primeiro domínio.
4. [ ] Migrar dados, estados vazios/erro e testes antes de adicionar os domínios dependentes.
5. [ ] Após cada domínio, remover do `ui` os scaffolds e dependências que a decisão tornou desnecessários.
