# Plano: migrar do LiteLLM para um proxy TypeScript leve

> Historical note: this plan is kept as a migration record. Where it previously described
> `@settings/models/models.jsonc` or `model_proxy_credentials` as the long-term source of
> truth, read those passages as superseded by Task-C-0002 / spec 0002: the current
> operational source of truth for model routing is the database-backed registry in
> `model_proxy_models` and `model_proxy_providers`.

## Objetivo

Remover o LiteLLM como dependencia de runtime do projeto, mantendo o app como
hub local para acesso a modelos, credenciais, aliases, health checks, logs de
uso e custos.

Decisao importante: logs de uso e gastos nao saem do produto. Eles deixam de
ser uma responsabilidade do LiteLLM e passam a ser responsabilidade explicita
do proxy TypeScript. O proxy novo deve ser o ledger local de chamadas LLM:
request, resposta, tokens, custo calculado, latencia, erro e metadados de
roteamento.

O alvo nao e recriar o LiteLLM inteiro. O alvo e implementar, em TypeScript,
o subconjunto que o projeto usa hoje:

- proxy local OpenAI-compatible para consumidores como OpenCode, VS Code,
  health-check e prompt-eval;
- resolucao centralizada de modelo, provider, credencial e aliases;
- persistencia de requests, tokens, custo, latencia, status e erro;
- APIs internas para o dashboard continuar analisando uso de modelos.

## Decisoes Fechadas

- Storage novo: PostgreSQL. As tabelas do proxy substituem o papel operacional
  do banco LiteLLM e devem suportar analytics pesados, historico e auditoria.
- Historico: importar dados antigos para o novo schema. `LiteLLM_SpendLogs` e
  tabelas relacionadas ficam como fonte de importacao, nao como dependencia
  permanente do dashboard.
- Naming: renomear agressivamente os conceitos `litellm*`. A compatibilidade
  deve ser curta, explicita e voltada a leitura/import/export temporario, nao a
  manter o vocabulario LiteLLM indefinidamente.

## Estado Atual

Hoje o LiteLLM aparece em quatro papeis diferentes:

- Runtime de proxy: `packages/monitor` e configs geradas chamam uma URL local
  OpenAI-compatible configurada por `LITELLM_API_URL` e `LITELLM_API_KEY`.
- Fonte de modelos e parametros: rotas de modelos criam e atualizam
  `litellmParams`, incluindo campos como `litellm_credential_name`,
  `custom_llm_provider`, `model_name` e custos por token.
- Banco de analytics: `services/analytics-service` consulta diretamente
  tabelas como `LiteLLM_SpendLogs` e `LiteLLM_ProxyModelTable`.
- Saida para plugins: `services/agent-plugins` gera providers chamados
  `litellm`, mas esses providers ja usam `@ai-sdk/openai-compatible`.

Esses papeis devem ser separados antes de apagar codigo. A primeira troca deve
ser o runtime de proxy; a troca do schema de analytics vem depois.

## Principios

- TypeScript only: o proxy novo roda no mesmo ecossistema Node/Express do app.
- OpenAI-compatible primeiro: preservar `/v1/chat/completions` como contrato
  externo inicial.
- Renome agressivo com ponte curta: novos codigos, schemas, tabelas e configs
  devem usar nomes neutros como `modelProxy`, `modelRoute`, `provider`,
  `credential`, `model-alias` e `local-proxy`. Nomes `litellm*` entram apenas
  em adaptadores de importacao ou aliases temporarios.
- Uma fonte de verdade: o estado operacional de modelos e providers deve viver
  no registry em `model_proxy_models` e `model_proxy_providers`. Arquivos em
  `@settings/` nao sao mais a fonte canônica de routing.
- Credenciais fora de configs geradas: configs exportadas devem apontar para o
  proxy local, nao expor chaves upstream.
- Logs proprios antes de remover schema antigo: o dashboard so pode deixar de
  depender do LiteLLM depois que o proxy grava dados suficientes para analytics.
- Ledger de custo como core: toda chamada que passa pelo proxy deve gerar um
  registro persistido, inclusive erro, timeout e stream interrompido.
- Custo reproduzivel: salvar o custo calculado e tambem o snapshot de preco
  usado naquele request, para que mudancas futuras no registry nao alterem
  historico.
- Compatibilidade de analytics: manter o contrato atual de `/logs`,
  dashboards de gasto e evento WebSocket `spend_logs_changed` enquanto a fonte
  fisica troca de `LiteLLM_SpendLogs` para tabelas do proxy.

## Arquitetura Alvo

```txt
Cliente local
  OpenCode / VS Code / health-check / prompt-eval
        |
        v
Model Proxy TS
  /v1/chat/completions
  /v1/models
  /v1/responses opcional
        |
        +-- ModelResolver
        |     alias -> model config -> provider -> upstream model
        |
        +-- CredentialResolver
        |     provider/model -> credential alias -> secret material
        |
        +-- ProviderAdapters
        |     openai-compatible
        |     anthropic
        |     google/gemini
        |     outros depois
        |
        +-- UsageAndSpendLedger
              model_proxy_requests
              model_proxy_messages
              model_proxy_usage_adjustments
              model_proxy_models
              model_proxy_providers
```

## Novos Modulos Propostos

### `services/model-proxy`

Pacote TypeScript com a logica de proxy, independente do Express app quando
possivel.

Responsabilidades:

- validar payloads OpenAI-compatible;
- resolver aliases e modelos reais;
- montar request upstream;
- aplicar credencial correta;
- encaminhar streaming SSE sem buffering desnecessario;
- capturar usage, status, TTFT, latencia e erro;
- gravar logs normalizados de uso e gasto;
- persistir custos calculados por request;
- emitir mudancas de logs para o watcher/WebSocket existente;
- mascarar credenciais em payloads persistidos.

Estrutura sugerida:

```txt
services/model-proxy/src/
  index.ts
  router.ts
  schemas/
    chat-completions.ts
    provider.ts
  resolver/
    model-resolver.ts
    credential-resolver.ts
    alias-resolver.ts
  adapters/
    adapter.ts
    openai-compatible.ts
    anthropic.ts
  logging/
    request-ledger.ts
    usage-extractor.ts
    cost-calculator.ts
    payload-redactor.ts
    spend-log-presenter.ts
  streaming/
    sse-forwarder.ts
    stream-parser.ts
```

### `repositories/app-repository` ou pacote novo de persistencia

Usar PostgreSQL para as tabelas proprias do proxy. Esse banco passa a ser a
fonte operacional de logs, gastos, settings, credenciais e historico importado.
SQLite pode continuar existindo para dados locais auxiliares, mas nao deve ser
a fonte de verdade para analytics.

Tabelas iniciais:

```txt
model_proxy_requests
  request_id
  call_type
  model
  resolved_model
  model_id
  model_group
  provider_id
  adapter
  api_base
  upstream_model
  user_id
  end_user
  team_id
  organization_id
  api_key_alias
  status
  status_code
  start_time
  end_time
  completion_start_time
  request_duration_ms
  time_to_first_token_ms
  prompt_tokens
  completion_tokens
  total_tokens
  cached_tokens
  reasoning_tokens
  provider_usage
  usage_source
  usage_estimated
  input_cost_per_token
  output_cost_per_token
  input_cost
  output_cost
  total_cost
  cost_currency
  cost_source
  cost_estimated
  cache_hit
  cache_key
  request_payload
  response_payload
  messages
  request_tags
  error_message
  error_type
  error_status_code
  error_details
  metadata
  created_at
  updated_at

model_proxy_messages
  id
  request_id
  role
  content
  tool_call_id
  tool_name
  ordinal
  created_at

model_proxy_usage_adjustments
  id
  request_id
  reason
  prompt_tokens_delta
  completion_tokens_delta
  total_cost_delta
  note
  created_at

model_proxy_models
  id
  model_name
  display_name
  provider_id
  adapter
  upstream_model
  model_route
  context_window
  max_output_tokens
  input_cost_per_token
  output_cost_per_token
  enabled
  metadata
  created_at
  updated_at

model_proxy_providers
  id
  name
  display_name
  adapter
  base_url
  secret_ref
  config
  created_at
  updated_at

model_proxy_api_keys
  id
  alias
  token_hash
  status
  scopes
  user_id
  team_id
  metadata
  created_at
  last_used_at

model_proxy_aliases
  alias
  target_model
  source
  owner
  updated_at

model_proxy_settings
  key
  value
  updated_at
  updated_by

model_proxy_import_jobs
  id
  source
  status
  started_at
  finished_at
  imported_count
  skipped_count
  error_message
  metadata
```

Notas de persistencia:

- `model_proxy_requests` deve ser suficiente para responder a tela `/logs` e
  os graficos de gasto sem precisar de join obrigatorio.
- `model_proxy_messages` existe para detalhes e simulacao de chat, mas o log
  principal tambem pode manter `messages` em JSON para preservar compatibilidade
  com o contrato atual.
- `provider_usage` guarda o usage bruto retornado pelo provider. Os campos
  normalizados (`prompt_tokens`, `completion_tokens`, `total_tokens`) sao a
  fonte de consulta do dashboard.
- `usage_estimated` e `cost_estimated` devem ser `true` quando o provider nao
  devolver usage confiavel e o app precisar estimar tokens ou custo.
- `model_proxy_usage_adjustments` permite correcao manual/importada sem editar
  o request original.
- `model_proxy_models` substitui `LiteLLM_ProxyModelTable` como registry dos
  modelos roteaveis pelo proxy.
- `model_proxy_providers` guarda os dados de provider/upstream usados na
  resolucao do registry.
- `model_proxy_api_keys` guarda chaves locais usadas por OpenCode, VS Code,
  health-check e outros clientes para chamar o proxy.
- `model_proxy_settings` substitui usos atuais de `LiteLLM_Config`, incluindo
  `router_settings`, `default_credential` e `health_check_prompt`.
- `model_proxy_import_jobs` registra importacoes de historico, incluindo dados
  vindos de `LiteLLM_SpendLogs` ou cloud sync.

## Escopo que Nao Pode Ficar de Fora

### Settings antes gravados em `LiteLLM_Config`

Migrar para `model_proxy_settings`:

- aliases de roteamento, hoje em `router_settings.model_group_alias`;
- default credential;
- prompt do health-check;
- metadados internos de aliases gerenciados.

### Credenciais e chaves locais

Separar explicitamente:

- credenciais upstream, usadas para chamar OpenAI, Anthropic, Gemini ou outro
  provider;
- API keys locais, usadas por clientes para chamar o proxy;
- dimensao de gasto por chave, preservando os relatorios atuais de spend por
  API key.

### Error logs e monitor

O proxy deve gravar erro estruturado suficiente para substituir a combinacao
atual de `LiteLLM_SpendLogs` + `LiteLLM_ErrorLogs`:

- `error_type`;
- `error_message`;
- `status_code`;
- payload mascarado;
- provider/upstream;
- modelo solicitado e resolvido;
- status final (`success`, `failed`, `cancelled`, `timeout`).

Os detectores do monitor tambem dependem de erro por modelo, requests presos,
status nao-sucesso, health por janela e TTFT. Esses metodos devem ser migrados
junto com `AnalyticsDataSource`.

### Analytics completo

A migracao nao termina em `/logs`. O novo schema precisa cobrir:

- dashboard principal;
- spend diario e horario;
- token trends;
- cost efficiency;
- distribuicao por modelo;
- distribuicao por API key;
- top users e top API keys por modelo;
- latencia media e percentis p50/p95/p99;
- TTFT percentiles;
- cache hit rate;
- status distribution;
- provider breakdown;
- error breakdown e error trend.

### Model registry e sync

Substituir `LiteLLM_ProxyModelTable` por um registry proprio do proxy. A UI
deve abandonar estados como `litellm-only`, `config-to-litellm` e
`litellm-to-config`, trocando para conceitos como:

- `registry-only`;
- `config-only`;
- `synced`;
- `config-to-registry`;
- `registry-to-config`.

### Prompt eval

`prompt-eval` deve deixar de tratar `litellm` como provider especial. O default
passa a ser o proxy local:

- `EVAL_PROVIDER=model-proxy`;
- `EVAL_BASE_URL` aponta para `/v1` do proxy;
- `EVAL_API_KEY` usa chave local do proxy;
- fallbacks `LITELLM_API_URL` e `LITELLM_API_KEY` entram apenas na ponte de
  migracao.

### Cloud sync e backup

`sync:cloud` deve importar dados para `model_proxy_requests`, nao para
`LiteLLM_SpendLogs`. O backup deve mudar de "backup do banco LiteLLM" para
"backup do banco de analytics/proxy" e incluir as novas tabelas.

### Provider-specific fields

O proxy deve preservar ou normalizar campos usados pelo health-check, incluindo
`provider_specific_fields.reasoning_content` e o fallback sem
`reasoning_effort`.

## Fases da Migracao

### Fase 0: inventario e fronteiras

Entregaveis:

- Mapear todos os usos de `LITELLM_*`, `litellmParams`,
  `LiteLLM_SpendLogs`, `LiteLLM_ErrorLogs`, `LiteLLM_Config`,
  `LiteLLM_CredentialsTable`, `LiteLLM_ProxyModelTable` e
  `provider.litellm`.
- Classificar cada uso como runtime, analytics, config gerada, UI ou legado.
- Criar uma lista de compatibilidade obrigatoria para o primeiro proxy.
- Definir matriz de renome agressivo:
  - `litellmParams` -> `modelRoute`;
  - `provider.litellm` -> `provider.local-proxy`;
  - `litellm-alias` -> `model-alias`;
  - `LiteLLM_*` -> `model_proxy_*`;
  - `LITELLM_*` -> `MODEL_PROXY_*`.

Resultado esperado:

- Nenhuma mudanca comportamental.
- Documento de inventario revisado antes da implementacao do proxy.

### Fase 1: proxy local minimo

Entregaveis:

- Criar `services/model-proxy`.
- Registrar rotas no server:
  - `POST /v1/chat/completions`;
  - `GET /v1/models`.
- Implementar adapter `openai-compatible`.
- Suportar request com e sem stream.
- Encaminhar SSE preservando `data: ...` e `[DONE]`.
- Usar o registry do banco para listar modelos habilitados.
- Criar `provider.local-proxy` e `provider` upstream neutro desde o primeiro
  corte. Se `provider.litellm` existir em config antiga, ler apenas por adapter
  de migracao e gravar de volta como `provider.local-proxy`.
- Mesmo no MVP, criar um registro de request em memoria ou tabela experimental
  para provar que a captura de status, latencia e erro acontece dentro do proxy.

Resultado esperado:

- `HEALTH_CHECK` consegue apontar para `http://localhost:3008/v1`.
- OpenCode pode continuar usando provider OpenAI-compatible apontando para o
  server local.
- O LiteLLM ainda pode existir por baixo como upstream temporario apenas se for
  configurado como provider upstream legado importado, mas deixa de ser o
  endpoint que os clientes locais chamam diretamente.
- A partir desta fase, toda chamada de cliente local deve passar pelo ponto onde
  os logs finais serao capturados.

### Fase 2: credenciais e providers neutros

Entregaveis:

- Introduzir schema de provider neutro:

```json
{
  "provider": {
    "local-proxy": {
      "name": "Local Model Proxy",
      "baseUrl": "http://localhost:3008/v1",
      "apiKey": "{env:MODEL_PROXY_API_KEY}"
    },
    "openai": {
      "name": "OpenAI",
      "adapter": "openai-compatible",
      "baseUrl": "https://api.openai.com/v1",
      "defaultCredential": "openai-main"
    }
  }
}
```

- Manter leitura compat de `provider.litellm` durante a transicao.
- Criar `MODEL_PROXY_API_URL` e `MODEL_PROXY_API_KEY`, mantendo fallback para
  `LITELLM_API_URL` e `LITELLM_API_KEY`.
- Renomear conceitos internos para `modelRoute`, quebrando o vocabulario
  `litellmParams` no codigo novo. Onde houver contrato publico antigo, criar
  adapter de entrada/saida temporario.
- Ajustar UI de modelos para falar em proxy/local provider, nao em LiteLLM DB.
- Criar storage PostgreSQL para `model_proxy_settings`,
  `model_proxy_providers` e `model_proxy_api_keys`.
- Migrar default credential, health-check prompt e router settings para
  `model_proxy_settings`.

Resultado esperado:

- O usuario consegue configurar provider real e credencial sem depender da
  nomenclatura LiteLLM.
- Configs antigas continuam carregando apenas via adapter temporario.

### Fase 3: logs proprios do proxy

Entregaveis:

- Gravar todo request em `model_proxy_requests` antes de chamar o upstream, com
  status inicial `pending` ou equivalente.
- Atualizar o mesmo registro ao finalizar, falhar, cancelar ou estourar timeout.
- Capturar:
  - modelo solicitado;
  - modelo resolvido;
  - provider;
  - adapter;
  - upstream model;
  - user/end_user/team/metadata quando existirem no payload;
  - status HTTP;
  - erro;
  - start/end time;
  - TTFT quando stream;
  - usage retornado pelo provider;
  - usage normalizado;
  - custo calculado com os custos armazenados no registry;
  - snapshot do preco usado no calculo;
  - payload de request e response mascarado.
- Gravar erro estruturado no mesmo ledger, suficiente para substituir
  `LiteLLM_ErrorLogs`.
- Persistir logs tambem quando:
  - upstream retorna erro;
  - cliente encerra stream antes do `[DONE]`;
  - provider nao retorna `usage`;
  - proxy rejeita request por modelo/credencial invalida.
- Calcular custo como:
  - `prompt_tokens * input_cost_per_token`;
  - `completion_tokens * output_cost_per_token`;
  - campos extras como cached/reasoning tokens devem entrar apenas quando a
    regra de preco do modelo estiver definida.
- Marcar `usage_estimated` quando o uso vier de estimativa local, e nao do
  provider.
- Mascarar headers e credenciais antes de persistir.
- Reaproveitar o contrato atual de `SpendLogEntry` na camada de presenter para
  que `/logs` nao precise mudar de uma vez.
- Integrar com o watcher atual de logs:
  - manter `spend_logs_changed`;
  - detectar novo `request_id`;
  - detectar mudanca de `pending` para `success`/`failed`/`cancelled`.
- Adicionar testes para sucesso, erro upstream, timeout, stream completo e
  stream interrompido.

Resultado esperado:

- O proxy novo tem telemetria suficiente para substituir
  `LiteLLM_SpendLogs` e `LiteLLM_ErrorLogs`.
- `/logs` mostra requests novos do proxy com gasto, tokens, status e detalhe.
- O dashboard ainda pode continuar lendo as tabelas antigas ate a proxima fase.

Regra de corte:

- Nao remover `LiteLLM_SpendLogs` enquanto o proxy nao estiver salvando custo e
  usage de todos os caminhos que chamam modelos em runtime.
- A remocao do LiteLLM so pode acontecer depois de pelo menos uma janela local
  de comparacao entre logs antigos e logs novos.

### Fase 4: AnalyticsDataSource sobre schema novo

Entregaveis:

- Criar implementacao paralela do `AnalyticsDataSource` lendo as tabelas
  `model_proxy_*`, sem alterar o contrato publico usado pelo frontend.
- Criar uma camada presenter/mapper que entregue os mesmos campos esperados
  hoje por `SpendLogEntry`:
  - `spend`;
  - `api_key`;
  - `proxy_server_request`;
  - `messages`;
  - `response`;
  - `custom_llm_provider`;
  - `model_group`;
  - `time_to_first_token_ms`.
- Migrar query por query, com equivalencia de campos:

```txt
LiteLLM_SpendLogs.model              -> model_proxy_requests.model
LiteLLM_SpendLogs.spend              -> model_proxy_requests.total_cost
LiteLLM_SpendLogs.startTime          -> model_proxy_requests.start_time
LiteLLM_SpendLogs.endTime            -> model_proxy_requests.end_time
LiteLLM_SpendLogs.completion_tokens  -> model_proxy_requests.completion_tokens
LiteLLM_SpendLogs.prompt_tokens      -> model_proxy_requests.prompt_tokens
LiteLLM_SpendLogs.api_key            -> model_proxy_requests.api_key_alias
LiteLLM_SpendLogs.api_base           -> model_proxy_requests.api_base
LiteLLM_SpendLogs.call_type          -> model_proxy_requests.call_type
LiteLLM_SpendLogs.messages           -> model_proxy_requests.messages
LiteLLM_SpendLogs.response           -> model_proxy_requests.response_payload
LiteLLM_SpendLogs.proxy_server_request
                                      -> model_proxy_requests.request_payload
LiteLLM_SpendLogs.custom_llm_provider
                                      -> model_proxy_requests.provider_id
LiteLLM_ErrorLogs.exception_type      -> model_proxy_requests.error_type
LiteLLM_ErrorLogs.exception_string    -> model_proxy_requests.error_message
LiteLLM_ErrorLogs.status_code         -> model_proxy_requests.error_status_code
LiteLLM_Config.param_name/value       -> model_proxy_settings.key/value
LiteLLM_CredentialsTable              -> model_proxy_providers
LiteLLM_ProxyModelTable               -> model_proxy_models
```

- Adicionar feature flag de data source:

```txt
ANALYTICS_DATA_SOURCE=litellm | model-proxy | hybrid
```

- Usar `hybrid` durante a transicao:
  - historico antigo vem de `LiteLLM_SpendLogs`;
  - requests novos vem de `model_proxy_requests`;
  - deduplicar por `request_id` se houver dual-write/import.
- Rodar as duas fontes em paralelo em ambiente local e comparar totais de:
  request count, tokens, custo, erro e latencia.
- Criar script de importacao obrigatorio para historico:
  - copia dados historicos de `LiteLLM_SpendLogs` para `model_proxy_requests`;
  - copia dados de erro de `LiteLLM_ErrorLogs` quando existirem;
  - copia settings relevantes de `LiteLLM_Config`;
  - copia providers/configuracoes operacionais para o novo schema;
  - preserva `request_id`;
  - marca `metadata.source = "litellm-import"`;
  - nao sobrescreve requests ja gravados pelo proxy.
- Migrar `sync:cloud` para inserir no novo schema.

Resultado esperado:

- Dashboard funciona lendo apenas logs do proxy novo.
- LiteLLM deixa de ser necessario para analytics recentes.
- Historico antigo continua acessivel pelo schema novo depois da importacao.

### Fase 5: configs geradas e plugins

Entregaveis:

- Renomear provider gerado de `litellm` para `local-proxy`.
- Remover `litellmConfig` do contexto de plugins e substituir por
  `modelProxyConfig`.
- Trocar `{env:LITELLM_API_KEY}` por `{env:MODEL_PROXY_API_KEY}` em configs
  geradas.
- Renomear plugin `litellm-alias` para um conceito neutro, como
  `model-alias`.
- Atualizar OpenCode, VS Code e OpenAgent para usar a URL local do proxy.
- Atualizar testes para esperar os nomes novos.
- Manter apenas export/adapters de leitura legado onde necessario para abrir
  configs antigas e migrar automaticamente.

Resultado esperado:

- `@storage/output/opencode.json` e arquivos equivalentes apontam para o proxy
  TS local.
- Nenhuma config gerada precisa conhecer credenciais upstream.
- Arquivos novos nao usam provider `litellm`, plugin `litellm-alias` nem env
  `LITELLM_API_KEY`.

### Fase 6: remocao do LiteLLM

Entregaveis:

- Remover Docker/runtime LiteLLM da documentacao e scripts principais.
- Remover dependencia obrigatoria de `repositories/litellm-repository`.
- Manter scripts de importacao historica como ferramenta offline/opcional,
  fora do runtime.
- Remover fallbacks `LITELLM_*` depois que configs, `.env.example` e arquivos
  gerados estiverem migrados.
- Renomear documentacao, README, comandos e scripts para falar em model proxy,
  analytics DB e provider registry.
- Trocar backup para mirar o banco PostgreSQL novo do proxy/analytics.
- Confirmar que `ANALYTICS_DATA_SOURCE=model-proxy` cobre:
  - dashboard principal;
  - `/logs`;
  - detalhe de log;
  - gasto por modelo;
  - gasto por usuario;
  - gasto por chave/credencial;
  - WebSocket `spend_logs_changed`.

Resultado esperado:

- `pnpm dev` sobe server, web e proxy TS sem container LiteLLM.
- O dashboard funciona com dados novos gerados pelo proxy proprio.
- Dados antigos ficam preservados no schema novo por importacao.

## MVP Recomendado

O primeiro corte deve ser pequeno:

1. Criar `services/model-proxy`.
2. Registrar `POST /v1/chat/completions` no server atual.
3. Implementar adapter OpenAI-compatible.
4. Apontar health-check para `http://localhost:3008/v1`.
5. Confirmar streaming, TTFT e erro em health-check.
6. Gerar OpenCode apontando para o proxy local.
7. Gravar logs em PostgreSQL.

Esse MVP ainda pode encaminhar para o LiteLLM como upstream. Mesmo assim, ele
ja muda a dependencia externa dos clientes: clientes passam a depender do app,
nao diretamente do LiteLLM.

Para preservar logs e gastos, o MVP nao deve ser considerado completo se ele
apenas encaminhar request. O minimo aceitavel e gravar cada chamada com
`request_id`, modelo, status, start/end time, tokens quando disponiveis e custo
calculado quando houver usage.

## Riscos

- Streaming SSE: se o proxy fizer buffering acidental, health-check e UX de
  clientes vao parecer lentos.
- Usage inconsistente: nem todo provider retorna tokens no mesmo formato,
  principalmente em stream.
- Custo calculado: o app deve usar custo local por token como fonte principal,
  nao confiar cegamente no upstream.
- Logs incompletos: se algum caminho chamar provider fora do proxy, o dashboard
  perde gasto. A migracao deve fazer health-check, prompt-eval e configs
  geradas passarem pelo proxy local.
- Estimativa de tokens: alguns providers nao retornam usage em stream. O app
  precisa distinguir uso real de uso estimado para nao apresentar custo como
  absoluto quando ele nao for.
- SQL legado: queries atuais usam nomes e colunas especificas do LiteLLM; a
  migracao do analytics e a parte mais trabalhosa.
- Renome agressivo: OpenCode, VS Code, OpenAgent, UI, contratos e testes podem
  quebrar juntos. O risco deve ser controlado com adapters de leitura e
  migracao automatica, nao mantendo os nomes antigos no codigo novo.

## Validacao

Checks por fase:

- Proxy:
  - request non-stream retorna formato OpenAI-compatible;
  - request stream retorna SSE incremental;
  - Authorization local e upstream sao separados;
  - erro upstream vira resposta coerente e log persistido.
- Health-check:
  - `health_check_stream_started`, `delta` e `completed` continuam na ordem;
  - fallback sem `reasoning_effort` continua funcionando;
  - TTFT e tokens/s continuam preenchidos quando possivel.
- Analytics:
  - totais por modelo batem entre fonte antiga e nova em uma janela curta;
  - `/logs` mostra requests novos do proxy;
  - detalhes do log exibem payload mascarado;
  - requests com erro aparecem em `/logs`;
  - stream cancelado gera log finalizado como `cancelled` ou equivalente;
  - `spend_logs_changed` invalida queries quando um request novo chega;
  - custo historico nao muda quando o preco de um modelo e alterado depois.
  - dados importados de `LiteLLM_SpendLogs` aparecem nos mesmos graficos dos
    dados novos;
  - error logs e detectores do monitor continuam funcionando sem
    `LiteLLM_ErrorLogs`.
- Configs:
  - `@storage/output/opencode.json` aponta para o proxy local;
  - configs novas usam `local-proxy`, `model-alias` e `MODEL_PROXY_API_KEY`;
  - chaves upstream nao aparecem em arquivos gerados.

Comandos sugeridos:

```bash
pnpm --filter @lite-llm/server typecheck
pnpm --filter @lite-llm/monitor typecheck
pnpm --filter @lite-llm/analytics-service typecheck
pnpm test
pnpm build
```

## Decisoes Pendentes

Resolvidas em Sprint 6 — ver [batch-5-decisions.md](./batch-5-decisions.md) §7.

- ~~O proxy deve rodar como rota do server atual ou como processo separado no monorepo?~~ → rota do server
- ~~Credenciais devem ser criptografadas no banco local ou referenciadas por variavel de ambiente/secret manager?~~ → `secret_ref` + env
- ~~O primeiro adapter Anthropic deve converter para OpenAI-compatible ou expor apenas via upstream OpenAI-compatible?~~ → adiado; upstream OpenAI-compatible
- ~~Qual a janela exata para manter adapters de leitura legado apos o renome agressivo?~~ → somente CLIs offline
