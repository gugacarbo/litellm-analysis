# Design: Remover `fallbackModels` de agentes/categorias e manter `globalFallbackModel`

## 1) Contexto e objetivo

Hoje a plataforma suporta fallback de modelo em três níveis:

- `model` primário por agente/categoria
- `fallbackModels` por agente/categoria
- `globalFallbackModel` no nível global

Objetivo desta mudança:

- remover `fallbackModels` de agentes e categorias em toda a codebase;
- manter apenas `globalFallbackModel` como fallback do sistema;
- padronizar o fluxo efetivo para: `model primário -> global-fallback`.

Decisão aprovada: remoção completa, sem modo legado e sem depreciação transitória.

## 2) Escopo

### Em escopo

- Contratos/tipos compartilhados e tipos de frontend.
- Schemas de repositório e validação de configuração.
- Formulários e normalização no frontend de agentes/categorias.
- Resolução de aliases e geração de aliases no serviço de modelos.
- Plugins de exportação (`opencode`, `openagent`, `litellm-alias`).
- Configuração fonte (`@settings/agents/agents.jsonc`) e fixtures/testes.

### Fora de escopo

- Mudanças de UX além da remoção dos campos de fallback local.
- Alterações de comportamento fora do domínio de resolução de modelos.
- Migração automática de configs legadas em runtime.

## 3) Decisão de arquitetura

Arquitetura alvo simplificada:

1. **Entidades (agente/categoria)** carregam apenas `model` (primário).
2. **Config global** mantém apenas `globalFallbackModel` para fallback sistêmico.
3. **Resolução de rota/modelo** não itera fallback por entidade; aplica fallback global quando necessário.

Consequência direta: desaparece a cadeia intermediária por slot de fallback local.

## 4) Mudanças por camada

## 4.1 Contratos e tipos

- Remover `fallbackModels` dos contratos públicos relacionados a agente/categoria.
- Ajustar tipos de formulário e payload no frontend para não expor o campo.
- Garantir que a API continue tipada com `model` por entidade + `globalFallbackModel` global.

Impacto esperado: erros de compilação úteis em todos os pontos que ainda referenciem o campo removido.

## 4.2 Schemas e persistência

- Remover `fallbackModels` dos schemas Zod de agente/categoria/sistema no repositório de agentes.
- Manter `globalFallbackModel` no schema de configuração global.
- Atualizar `@settings/agents/agents.jsonc` removendo chaves `fallbackModels`.
- Regenerar schema JSON derivado para manter consistência com o Zod.

Política de integridade: configurações com `fallbackModels` passam a ser inválidas após a mudança.

## 4.3 Frontend (edição de agentes/categorias)

- Remover campos visuais de fallback local nos formulários.
- Ajustar normalizadores para não ler/gravar `fallbackModels`.
- Ajustar composição de payload na submissão.
- Garantir que edição/salvamento funcione com o novo shape sem regressão de UX.

## 4.4 Resolução de aliases (models-service)

- Simplificar lógica de resolução para eliminar loops/listas de fallback por entidade.
- Aplicar fluxo de resolução com apenas:
  - modelo principal configurado;
  - fallback global quando aplicável.

Resultado esperado: resolução mais previsível, menos ramificações e menor superfície de erro.

## 4.5 Plugins de saída

### `openagent`

- Não emitir mais `fallback_models` por agente/categoria.
- Manter referência ao fallback global em nível apropriado de output.

### `opencode`

- Não emitir fallback por `llm-agents`/`llm-categories`.
- Preservar provider global `global-fallback` como fallback único.

### `litellm-alias`

- Parar de consumir `agent/category.fallbackModels`.
- Gerar aliases com base em primário + fallback global.

## 4.6 Testes e fixtures

- Atualizar fixtures que contenham `fallbackModels`.
- Ajustar asserts de contratos/plugins para ausência do campo.
- Cobrir o fluxo primário + global fallback nas suítes centrais.

## 5) Fluxo de dados: antes vs depois

### Antes

`entity.model -> entity.fallbackModels[n] -> ... -> globalFallbackModel`

### Depois

`entity.model -> globalFallbackModel`

Benefícios:

- menor complexidade cognitiva;
- menor chance de inconsistência entre UI, schema e plugins;
- menos caminhos de execução para manter/testar.

## 6) Estratégia de migração de configuração

Estratégia escolhida: **hard cut**.

- Etapa 1: remover chaves `fallbackModels` da configuração fonte.
- Etapa 2: aplicar mudanças de código (tipos/schemas/services/plugins/UI).
- Etapa 3: atualizar testes/fixtures.

Sem compatibilidade legada em runtime. Arquivos antigos com `fallbackModels` devem ser atualizados antes do uso.

## 7) Riscos e mitigação

1. **Quebra ampla de compilação** (esperada) por remoção de campo.
   - Mitigação: ordem de execução por camadas + validação incremental por pacote.

2. **Regressão em geração de outputs de plugins**.
   - Mitigação: ajustar testes de snapshot/assert e validar artefatos gerados.

3. **Inconsistência temporária entre config e schema**.
   - Mitigação: atualizar `agents.jsonc` e schema derivado no mesmo bloco.

4. **Regressão de UX nos formulários**.
   - Mitigação: validar fluxos de criação/edição/salvamento no frontend.

## 8) Estratégia de validação

Validação incremental durante implementação:

```bash
pnpm --filter @lite-llm/contracts typecheck
pnpm --filter @lite-llm/agents-repository typecheck
pnpm --filter @lite-llm/agents-manager typecheck
pnpm --filter @lite-llm/models-service typecheck
pnpm --filter @lite-llm/agent-plugins typecheck
pnpm --filter @lite-llm/agent-plugins test
pnpm --filter @lite-llm/web typecheck
```

Validação final global:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 9) Critérios de aceite

- Não existe referência ativa a `fallbackModels` em código de produção.
- Agentes e categorias persistem/apresentam apenas `model` (sem fallback local).
- `globalFallbackModel` permanece funcional como fallback único.
- Plugins geram outputs sem fallback por entidade.
- Todos os checks definidos em validação final passam.

## 10) Plano de execução em blocos pequenos

1. **Contratos/tipos**: remover `fallbackModels` e corrigir compilações associadas.
2. **Schemas/config**: remover do Zod + atualizar `agents.jsonc` + regenerar schema JSON.
3. **Frontend**: remover campos e normalização de fallback local.
4. **Services de alias**: simplificar resolução para primário + global.
5. **Plugins**: ajustar `openagent`, `opencode`, `litellm-alias`.
6. **Testes/fixtures**: atualizar dados e asserts.
7. **Validação final**: lint/typecheck/test/build.

---

### Decisões registradas

- Abordagem escolhida: remoção completa (sem compatibilidade transitória).
- Sem fallback por agente/categoria em nenhum artefato final.
- Cadeia de fallback oficial: `model primário -> global-fallback`.
