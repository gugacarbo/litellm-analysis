# Task-A-2 — Preferências de UI server-side

## Resultado

Implementada a fronteira server-only de preferências em
`apps/ui/src/server/ui-preferences.functions.ts`, com parser tolerante,
serialização canônica de cookies, leitura SSR e mutações protegidas por sessão.

## TDD

### RED

Comando:

```bash
pnpm --dir apps/ui exec vitest run src/server/ui-preferences.functions.test.ts
```

Resultado: exit 1 esperado. O teste novo falhou ao importar o módulo ainda
inexistente: `Cannot find module '/src/server/ui-preferences.functions'`.

### GREEN

Comandos:

```bash
pnpm --dir apps/ui exec vitest run src/server/ui-preferences.functions.test.ts --exclude '**/server/auth/invites.test.ts'
pnpm --dir apps/ui typecheck
pnpm --dir apps/ui exec prettier --check src/server/ui-preferences.functions.ts src/server/ui-preferences.functions.test.ts
git diff --check -- apps/ui/src/server/ui-preferences.functions.ts apps/ui/src/server/ui-preferences.functions.test.ts
```

Resultados:

- Vitest: exit 0; 1 arquivo e 6 testes passaram.
- Typecheck: exit 0 (`tsc --noEmit`).
- Prettier: exit 0; ambos os arquivos seguem o estilo configurado.
- `git diff --check`: exit 0, sem erros de whitespace.

## Arquivos alterados

- `apps/ui/src/server/ui-preferences.functions.ts` — novo módulo de contrato,
  parser, serialização, handlers puros e `createServerFn` de leitura/escrita.
- `apps/ui/src/server/ui-preferences.functions.test.ts` — testes focados de
  fallback, valores canônicos, atributos de cookie e autorização.
- `docs/jobs/0003-ui-shell-autenticado/Task-A-2/report.md` — este relatório.

## Contrato de sessão e cookies

- `getUiPreferences` lê somente o header `Cookie` já disponível à renderização
  SSR e retorna `theme` (`light` como fallback) e `sidebar` (`expanded` como
  fallback). Valores ausentes, malformados ou fora do conjunto canônico não são
  propagados.
- `setThemePreference` aceita exclusivamente `light`/`dark`; `setSidebarPreference`
  aceita exclusivamente `expanded`/`collapsed`, ambas por validadores Zod.
- Antes de escrever, as duas mutações usam `getRequest()` e `requireSession`.
  Sem sessão ou requisição, retornam `UNAUTHENTICATED` e não chamam a emissão de
  `Set-Cookie`.
- Cookies `ui_theme` e `ui_sidebar` usam `Path=/`, `SameSite=Lax` e
  `Max-Age=15552000` (180 dias); `Secure` aparece somente em produção e
  `HttpOnly` não é enviado. Toda mutação autenticada serializa novamente o
  cookie, renovando o prazo.

## Escopo e preocupações

O trabalho ficou restrito aos dois arquivos de preferência e a este relatório:
não houve localStorage, componente client-side, schema, migration ou alteração
de fluxo de autenticação. Nenhuma preocupação pendente para a task; a
integração de SSR/pre-paint e callbacks de interface continua pertencendo às
tasks C-1 e B-1.
