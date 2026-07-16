# Process: super-planning — Fase 1 (BRAINSTORM)

> Decisões para melhorar a UX da configuração de modelos. Regras em
> `/home/gustavo/.agents/skills/super-planning/phases/01-brainstorm.md`.

## Problema e objetivo

A tela de configuração do modelo expõe todos os campos básicos e avançados em
uma única sequência vertical. Mesmo com accordions, os grupos iniciais abertos
fazem a página parecer densa e tornam a edição cotidiana difícil de localizar.
O objetivo é preservar todos os parâmetros já suportados, mas apresentá-los em
abas orientadas à tarefa.

## Escopo aprovado

- Usar abas para separar a edição em grupos compreensíveis.
- Manter uma aba inicial para identidade, roteamento, limites básicos,
  aliases e descrição.
- Agrupar capacidades, modalidades, raciocínio e parâmetros em uma aba de
  capacidades e limites.
- Agrupar opções de requisição, preços e o modelo de raciocínio em uma aba de
  integração/execução.
- Manter salvar visível e ações de habilitar/desabilitar/excluir isoladas na
  área de gerenciamento, sem mover ou remover permissões existentes.
- Preservar a leitura para `viewer` e a edição para `admin`.

## Não objetivos

- Não alterar contratos, persistência, validação, autorização ou parâmetros
  disponíveis do modelo.
- Não introduzir wizard, mudança de rota por aba ou persistência de estado de
  navegação fora da página.
- Não redesenhar a lista de modelos ou a configuração de providers.

## Decisões de implementação

1. As abas serão locais à página e manterão os mesmos controles controlados
   pelo formulário existente; trocar de aba não descarta valores não salvos.
2. A primeira aba será o caminho de edição padrão e concentrará os metadados
   usados com mais frequência. As abas especializadas evitarão um longo bloco
   de accordions aberto por padrão.
3. Cada aba terá título e descrição curtos, com campos relacionados em grids
   responsivos. As abas devem caber em viewport estreito com rolagem horizontal
   ou quebra legível, sem esconder opções.
4. O botão de salvar ficará associado ao formulário e visível após a troca de
   aba, enquanto a área destrutiva permanecerá no fim da página.
5. A implementação terá testes de regressão ao final; TDD não é necessário
   para esta mudança predominantemente visual.

## Restrições e riscos

- Nenhum campo avançado pode desaparecer ou deixar de ser enviado no payload.
- Não pode haver campos duplicados em mais de uma aba com estados divergentes.
- A navegação por teclado, rótulos e estados somente leitura devem continuar
  acessíveis.
- A reorganização não pode afetar o fluxo de conflito de revisão, salvamento,
  toggle ou exclusão.

## Handoff

- visualCompanionUsed: false
- TDD confirmado como não necessário em 2026-07-15.

## Resultado da implementação

- A página usa as três abas definidas, preservando um único formulário,
  payload, permissões e ações de gerenciamento.
- A validação focada passou com cinco testes; typecheck e inspeção visual em
  desktop e viewport estreito foram concluídos em 2026-07-15.
