---
status: accepted
date: 2026-07-13
builds-on: []
implemented-by: []
---

> **Process: super-planning** — esta especificação foi produzida pela Phase 2 —
> SPEC do skill em `/home/gustavo/.agents/skills/super-planning/SKILL.md`. O documento
> de decisões da Phase 1 está em
> [`0004_shared-logger_decisions.md`](../spec-decisions/0004_shared-logger_decisions.md).

# O monorepo oferece um logger compartilhado configurável e bloqueia novos `console.log`

> Convenções compartilhadas: este trabalho segue o contrato atual de pacotes
> workspace em `packages/*`, o hook `scripts/pre-commit` e o guia de testes em
> `docs/context/testing-anti-patterns.md`.

## Objetivo

Disponibilizar um logger server-side compartilhado em `@lite-llm/logger`, com
identificação obrigatória do `consumer`, saída JSON para operação e saída
pretty colorida para desenvolvimento. O `apps/ui` deve consumir esse pacote
por meio do seu `ServerContext`, e o pre-commit deve impedir novos usos de
`console.log` fora das exceções declaradas.

## Fluxo

1. Um consumidor server-side chama `createLogger({ consumer })`.
2. O logger lê `LOGGER_FORMAT` do ambiente. `json` é o formato padrão quando a
   variável está ausente ou inválida; `pretty` ativa a saída humana.
3. Ao chamar `debug(event, meta?)`, `info(event, meta?)`, `warn(event, meta?)`
   ou `error(event, meta?)`, o logger monta uma entrada com `level`, `event`,
   `consumer`, timestamp ISO-8601 e metadata.
4. No formato JSON, a entrada é emitida em uma única linha; `debug` usa a saída
   de debug, `info` usa a saída informativa, `warn` usa a saída de aviso e
   `error` usa a saída de erro.
5. No formato pretty, a entrada é apresentada em uma linha humana com timestamp,
   nível, consumer, evento e metadata. `chalk` aplica cores quando o ambiente
   suporta saída colorida.
6. O `apps/ui/src/server/context.ts` cria o logger com `consumer: "ui"` e
   expõe o contrato pelo `ServerContext`.
7. O hook `scripts/pre-commit` executa o guard de `console.log` sobre o estado
   staged. O guard analisa chamadas reais nas linhas adicionadas, informa cada
   violação com arquivo/linha e termina com código diferente de zero quando
   encontrar alguma.

## Contrato

### Pacote `@lite-llm/logger`

O pacote deve exportar uma API pública equivalente a:

```ts
type LogMetadata = Record<string, unknown>;

type Logger = {
  debug: (event: string, meta?: LogMetadata) => void;
  info: (event: string, meta?: LogMetadata) => void;
  warn: (event: string, meta?: LogMetadata) => void;
  error: (event: string, meta?: LogMetadata) => void;
};

function createLogger(params: { consumer: string }): Logger;
```

O pacote deve declarar `chalk` como dependência de runtime e expor um entry
point público pelo `package.json`.

### Formato JSON

Com `LOGGER_FORMAT=json` ou fallback, uma chamada como:

```ts
logger.info("runtime_status_success", {
  requestId: "req_123",
  durationMs: 42,
});
```

deve produzir uma linha equivalente a:

```json
{
  "level": "info",
  "consumer": "ui",
  "event": "runtime_status_success",
  "timestamp": "2026-07-13T15:42:08.123Z",
  "requestId": "req_123",
  "durationMs": 42
}
```

O timestamp deve ser gerado no momento da emissão e estar em ISO-8601. A
entrada não deve conter códigos de cor ANSI.

### Formato pretty

Com:

```env
LOGGER_FORMAT=pretty
```

a mesma chamada deve ser exibida de forma equivalente a:

```text
2026-07-13T15:42:08.123Z  INFO   [ui] runtime_status_success  requestId=req_123 durationMs=42
```

O modo pretty deve usar Chalk para aplicar, quando suportado pelo terminal:

- timestamp em cinza;
- `DEBUG` em azul/cinza;
- `INFO` em verde;
- `WARN` em amarelo;
- `ERROR` em vermelho;
- consumer em ciano;
- evento em negrito.

O formato pretty não precisa ser parseável como JSON. A saída deve permanecer
em uma linha por evento.

### Guard de `console.log`

O script deve considerar arquivos staged JavaScript/TypeScript relevantes e
identificar chamadas reais a `console.log` nas linhas adicionadas do diff. Ele
deve ignorar comentários, strings, linhas removidas e chamadas em:

- `packages/logger/**`;
- qualquer caminho `**/scripts/**` usado por scripts/CLIs.

Fora dessas exceções, uma chamada nova deve produzir diagnóstico com caminho e
linha e retornar exit code diferente de zero. Sem violações, o exit code deve
ser zero. O script não deve modificar arquivos.

O `scripts/pre-commit` deve executar esse guard sem remover as etapas existentes
de `docs-check` e `check-staged`.

## Casos de borda

| #   | QUANDO o gatilho                                                          | o sistema DEVE responder                                                       |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | `LOGGER_FORMAT` está ausente ou contém valor diferente de `json`/`pretty` | Usar o formato JSON sem interromper a aplicação.                               |
| 2   | O terminal não suporta cores ou a saída está redirecionada                | Emitir o formato pretty sem ANSI; a estrutura e os campos continuam presentes. |
| 3   | `info` é chamado com metadata                                             | Incluir os campos fornecidos na mesma entrada do evento.                       |
| 4   | `debug` é chamado                                                         | Emitir uma entrada com `level: "debug"` no destino de debug do console.        |
| 5   | `warn` é chamado                                                          | Emitir uma entrada com `level: "warn"` no destino de aviso do console.         |
| 6   | `error` é chamado                                                         | Emitir uma entrada com `level: "error"` no destino de erro do console.         |
| 7   | Um `console.log` existente não foi alterado no commit                     | Não bloquear o commit por essa linha legada.                                   |
| 8   | Um `console.log` novo aparece em comentário ou string                     | Não classificá-lo como violação.                                               |
| 9   | Um `console.log` novo aparece fora das exceções                           | Exibir diagnóstico e falhar o guard.                                           |
| 10  | O guard é executado sem arquivos staged relevantes                        | Sair com sucesso e sem modificar o worktree.                                   |

## Questões em aberto

- Nenhuma.

## Definition of Done

```bash
pnpm --filter @lite-llm/logger typecheck       # exit 0
pnpm --filter @lite-llm/logger test            # todos os testes do pacote verdes (casos 1–6)
pnpm --filter ui typecheck                     # exit 0; migração do contexto compilando
pnpm exec vitest run scripts/code-checks/check-console-log.test.ts  # casos 5–8 verdes
pnpm check:console-log                         # exit 0 no estado final staged
```

## Estratégia de testes

- **Modo:** TDD confirmado pelo usuário para o pacote, a migração do UI e o
  guard.
- **Arquivo de orientação:** `docs/context/testing-anti-patterns.md`.
- **Runner e comandos:** Vitest para testes unitários; `tsc --noEmit` pelos
  scripts de `packages/logger` e `apps/ui`; execução do guard via script do
  workspace.

| ID  | Comportamento                                                       | Nível                | Evidência esperada                                           |
| --- | ------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------ |
| T1  | Factory exige consumer e inclui consumer/timestamp no JSON          | unitário             | RED antes da implementação; GREEN no teste do logger         |
| T2  | `debug`, `info`, `warn` e `error` emitem níveis e destinos corretos | unitário             | GREEN com spies apenas na fronteira do console               |
| T3  | `json` é padrão e `pretty` usa Chalk sem quebrar a linha única      | unitário             | GREEN com ambiente controlado e cores determinísticas        |
| T4  | Contexto do UI usa `createLogger({ consumer: "ui" })`               | integração focada    | GREEN no teste do contexto/consumidor                        |
| T5  | Guard aceita legado, comentários, strings e exceções                | unitário             | RED/GREEN com fixtures staged controladas                    |
| T6  | Guard rejeita nova chamada real fora das exceções                   | unitário             | RED/GREEN com diagnóstico e exit code não-zero               |
| T7  | Hook chama o guard preservando gates existentes                     | integração de script | execução do pre-commit/check dedicado com exit code esperado |

### Cenários de erro e exclusões

Os testes devem controlar `LOGGER_FORMAT`, suporte a cores e tempo para evitar
flakiness. Não devem mockar a implementação interna do logger. O teste do
guard deve usar fixtures temporárias ou snapshots de diff, sem alterar o
worktree do usuário. Não haverá cobertura de migração do gateway nem de todos
os usos históricos de `console.log`.

## Revisão humana

- Confirmar visualmente que o modo pretty permanece legível em um terminal real
  e que as cores distinguem informação de erro.
- Confirmar que os caminhos de exceção do guard não abrangem código de domínio
  acidentalmente.

## Verificação

```text
(preencher no fechamento)
```

# Self-Review

Verdict: approved — 2026-07-13. O escopo, contrato, formatos JSON/pretty,
consumer, fallback, exceções do guard, TDD e Definition of Done estão
consistentes e não há placeholders ou questões abertas.
