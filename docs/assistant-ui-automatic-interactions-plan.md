# Plano: assistant-ui para interações automáticas com streaming

## Resumo
- Instalar `assistant-ui` no `apps/web` via CLI com `pnpm dlx assistant-ui@latest add thread`, reaproveitando o `components.json` já existente para gerar os componentes dentro da árvore de UI compartilhada.
- Substituir o renderer customizado de mensagens por um renderer compartilhado baseado em `assistant-ui` em todos os pontos onde hoje há mensagens de agentes:
  `logs/chat simulation`, bloco de mensagens do `log detail dialog` e o `status details` do `health-check`.
- Adotar `assistant-ui` em modo `ReadonlyThreadProvider` para histórico e `useExternalStoreRuntime` sobre o WebSocket atual para sessões ao vivo de `health-check`.
- Manter os painéis de payload bruto, erro e metadados para debugging; só a renderização das mensagens passa para `assistant-ui`.

## Mudanças de implementação
- Criar um módulo compartilhado de thread, no frontend, responsável por:
  - normalizar `SpendLog.messages` e o fallback atual de `extractLogMessages(...)` para um formato único de thread;
  - normalizar `health-check` para uma conversa mínima `user -> assistant`, com suporte a estado parcial de streaming;
  - preservar metadados úteis por mensagem, como `tool_calls`, `tool_call_id`, origem, timestamp e payload bruto para detalhes/inspeção.
- Trocar a UI atual de [apps/web/src/features/logs/components/chat-simulation.tsx](/home/gustavo/Apps/lite-llm-analytics/apps/web/src/features/logs/components/chat-simulation.tsx), [apps/web/src/features/logs/components/log-detail-dialog.tsx](/home/gustavo/Apps/lite-llm-analytics/apps/web/src/features/logs/components/log-detail-dialog.tsx) e [apps/web/src/features/monitor/components/status-details-dialog.tsx](/home/gustavo/Apps/lite-llm-analytics/apps/web/src/features/monitor/components/status-details-dialog.tsx) para usar esse renderer compartilhado.
- No `health-check`, estender o fluxo atual de WebSocket para emitir eventos incrementais por execução:
  - `started`: abre a thread e marca `isRunning`;
  - `delta`: acrescenta texto parcial da resposta do assistente;
  - `completed`/`failed`: fecha a execução e sincroniza com o resultado final persistido.
- A origem dos `delta` deve sair do parser já existente no `HealthCheckService`, emitindo chunks no mesmo ponto em que hoje o backend já lê `content` e `reasoning_content` do stream.
- Em `/logs`, implementar tempo real como “novo log detectado e enviado por push”, não token a token:
  - adicionar um watcher leve no backend que observa os logs recentes, detecta novos `request_id` ou mudanças de status e publica um evento WS `spend_logs_changed`;
  - no frontend, `useLogsData`, detalhe do log, chat simulation e logs por modelo invalidam/refetcham queries relevantes ao receber esse evento;
  - quando um log novo ou atualizado é recarregado, sua thread histórica passa a ser renderizada automaticamente pelo mesmo componente assistant-ui.
- Preservar comportamento de debug existente:
  - `health-check` continua exibindo request/response payload, TTFT, tokens/s e erro em seções separadas;
  - `logs` continuam exibindo metadata, request body, response raw e badges contextuais fora da thread.
- Não criar runtime `data-stream` novo da assistant-ui agora; a base oficial do plano é reaproveitar o WS já existente com external store.

## APIs e tipos públicos
- Ampliar o contrato WS compartilhado com eventos novos para `health_check_stream_*` e `spend_logs_changed`.
- Adicionar um tipo frontend compartilhado para thread normalizada de interações automáticas, usado por logs e health-check.
- Ajustar o hook de health-check para expor execuções em andamento, mensagens parciais e estado `isRunning`, além dos resultados finais que já existem.

## Testes
- Frontend:
  - teste de normalização de logs com `tool_calls`, `tool` results, mensagens duplicadas e fallback vindo de `response`;
  - teste de normalização de `health-check` para conversa `user/assistant`;
  - teste do renderer assistant-ui para histórico e para atualização incremental por `delta`;
  - teste do `status details` garantindo que o texto parcial aparece durante o stream e o payload bruto continua acessível.
- Backend:
  - teste do `health-check` emitindo `started`, múltiplos `delta` e `completed` na ordem correta;
  - teste do watcher de logs emitindo evento só quando houver mudança real, sem flood;
  - teste dos tipos WS para garantir compatibilidade entre server e web.
- Verificação final:
  - `pnpm --filter web test`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web lint`
  - checks direcionados de server/monitor para os novos eventos de streaming.

## Assunções e defaults
- `assistant-ui` será instalado apenas no `apps/web`, via CLI, sem copiar componentes manualmente.
- `model-detail` fica coberto indiretamente porque reutiliza o `LogDetailDialog`.
- Streaming real será completo no `health-check`; em `/logs`, “tempo real” significa push de novos/atualizados registros persistidos, não reconstrução token a token do stream upstream.
- O renderer customizado atual de chat simulation pode ser removido depois da migração, desde que a nova thread preserve tool calls, raw view e leitura de mensagens já persistidas.
