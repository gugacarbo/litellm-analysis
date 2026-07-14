# Task-A-2 — Guard staged de `console.log`

Status: DONE — revisão final corrigida

## Escopo entregue

- `scripts/code-checks/check-console-log.ts`: lê apenas o diff staged, recupera o blob staged e usa a TypeScript Compiler API para localizar chamadas reais de `console.log` nas linhas adicionadas; ignora comentários, strings, linhas removidas, ausência de staged relevante, `packages/logger/**` e caminhos com segmento `scripts`.
- `scripts/code-checks/check-console-log.test.ts`: cobertura TDD dos casos legado, removido, comentário/string, exceções, chamada real, chamada multilinear, ausência de staged e integração do hook.
- `package.json`: adiciona `check:console-log`.
- `scripts/pre-commit`: executa o novo gate preservando `docs-check` e `check-staged`.

## TDD

### RED da correção da revisão

O finding foi reproduzido por inspeção do caminho de erro: a implementação
anterior capturava qualquer falha de `git diff --cached` e devolvia `""`, logo
o guard terminava com exit `0`. Foi adicionado um teste focado em cwd sem
repositório Git para fixar o contrato de erro não silencioso.

### RED

Comando:

```text
pnpm exec vitest run scripts/code-checks/check-console-log.test.ts
```

Resultado: RED — 5 testes falharam porque `scripts/code-checks/check-console-log.ts` ainda não existia; os cenários de violação também não podiam produzir o diagnóstico esperado.

### GREEN

Comando:

```text
pnpm exec vitest run scripts/code-checks/check-console-log.test.ts
```

Resultado: GREEN — 7 testes passaram. Os fixtures de violação produziram exit 1 e diagnóstico `src/example.ts:2`, enquanto legado, removido, comentários/strings e exceções passaram.

Após a correção da revisão, o focused suite passou com `8` testes no guard e
`18` testes nos dois arquivos focados. O novo cenário produz exit `1` e
diagnóstico contendo `Staged console.log check failed` e `git diff --cached`;
ausência legítima de staged relevante continua em exit `0`.

## Verificação

| Comando                                                                                                                     | Resultado                                    |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `pnpm exec vitest run scripts/code-checks/check-console-log.test.ts`                                                        | exit 0, 7/7 testes                           |
| `pnpm exec biome check scripts/code-checks/check-console-log.ts scripts/code-checks/check-console-log.test.ts package.json` | exit 0                                       |
| `pnpm check:console-log`                                                                                                    | exit 0, sem violações no estado staged atual |
| `pnpm --filter @lite-llm/logger run typecheck`                                                                              | exit 0                                       |
| `bash -n scripts/pre-commit`                                                                                                | exit 0                                       |
| `git diff --check`                                                                                                          | exit 0                                       |

## Self-review

- O guard não escreve no worktree e não varre histórico; usa `git diff --cached` e `git show :path`.
- A AST elimina falsos positivos de comentários e strings; o intervalo da chamada cobre chamadas multilineares.
- O hook mantém a ordem e a presença de `docs-check` e `check-staged`, adicionando `check:console-log` entre eles.
- Nenhum arquivo de `packages/logger` ou `apps/ui` foi editado.
- A revisão Important foi fechada distinguindo diff staged vazio (sucesso) de
  erro de execução/leitura do Git (diagnóstico e exit não-zero); o guard não
  volta a falhar aberto.
- `bash -n scripts/pre-commit` passou; a integração textual também foi coberta pelo teste e o script não sofreu alterações além da chamada do gate.
