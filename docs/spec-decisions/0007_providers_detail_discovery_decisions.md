# Process: super-planning — Fase 1 (BRAINSTORM)

> Decisões para a navegação e configuração de providers. Regras em
> `/home/gustavo/.agents/skills/super-planning/phases/01-brainstorm.md`.

## Problema e objetivo

A lista atual de providers concentra métricas e ações destrutivas no mesmo
card, tornando a leitura densa e a configuração difícil de localizar. O
objetivo é tornar cada provider um item de navegação e concentrar sua operação
em uma página própria.

## Escopo aprovado

- A lista em `/providers` exibe items compactos e clicáveis, sem botões de
  ação por card.
- Cada item abre `/providers/:providerId`.
- A página do provider concentra configuração, teste de conexão, provider
  padrão e remoção para administradores; viewers continuam somente leitura.
- Discovery e probe ficam em um painel lateral persistente, sem overlay sobre
  o conteúdo; o botão Discovery abre esse painel e ele permanece no layout
  enquanto a rota estiver ativa.
- O painel usa os mesmos contratos de descoberta, sincronização e probe já
  existentes; não há alteração do contrato de upstream ou da persistência.

## Não objetivos

- Não alterar adapters, schema de provider, criptografia de credenciais ou
  política de destinos.
- Não migrar a página de modelos nem alterar a UX de aliases.
- Não executar discovery automaticamente ao abrir a rota.

## Decisões de implementação

1. A rota de detalhe seguirá o padrão de `/models/:modelId/settings`, com
   loader autenticado que preenche a query do provider.
2. A lista usará links/itens semânticos para o detalhe, preservando a leitura
   de adapter, URL, credencial, modelos e estado padrão.
3. O painel Discovery será uma coluna lateral no desktop, e não o `Sheet`
   modal existente; em telas estreitas será empilhado abaixo da configuração
   para não ocultar conteúdo.
4. A ação de Discovery é o gatilho explícito para buscar modelos. O painel
   continua visível com último resultado, estado de sincronização e probe.
5. Teste de conexão antes de salvar continua disponível na criação; na página
   de detalhe o teste usa a credencial persistida já existente.

## Restrições e riscos

- Credenciais continuam sem retornar ao cliente ou aparecer em feedbacks.
- A página deve mostrar erros públicos e preservar os controles de papel.
- A lista e o detalhe devem lidar com remoção concorrente e provider ausente.
- O painel lateral precisa preservar acessibilidade e não reduzir a área de
  configuração de modo ilegível em viewports médios.

## Handoff

- visualCompanionUsed: false
- TDD confirmado em 2026-07-15.
