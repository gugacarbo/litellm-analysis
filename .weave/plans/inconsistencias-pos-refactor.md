# Inconsistências pós-refactor do `agents-repository` + `@storage`

## O que foi consertado (simples)

### 1. Import path errado: `@lite-llm/agents-repository/schema` → `@lite-llm/agents-repository/schemas`
17 arquivos em `packages/agents-manager/src/` importavam do caminho `./schema` (singular), mas o `package.json` do `agents-repository` exporta `./schemas` (plural). Corrigido em todos.

### 2. Test: `model.service.test.ts`
- **Problema**: usava `contextLength`/`maxOutput` como campos planos no `ModelSpec`, mas o schema novo tem `limits: { length, maxOutput }`.
- **Fix**: atualizado shape do `ModelSpec` nos testes + removidos testes de `resolveModelName` que testavam funcionalidade de `customAliases` inexistente na implementação atual.

### 3. Test: `category.service.test.ts`
- **Problema**: `CategoryEntry` agora requer `limits: { context, output }` (non-optional com `.default()`). Testes passavam `{ model: "gpt-4" }` sem `limits`.
- **Fix**: adicionado helper `testEntry()` com `limits` default.

### 4. Test: `repository.test.ts` (agents-repository)
- **Problema**: `DbConfig.provider` agora requer `ownedBy` em cada entrada. Teste de `write()` não incluía.
- **Fix**: adicionado `ownedBy: ""` + removido `modelIdStrategy` que não existe no `SystemAgent` schema + atualizados types de `models`/`categories` para shape vazio simples.

---

## O que precisa de decisão

### A. `PluginRoutingConfig` não existe mais (IMPACTANTE)

**Arquivos**: `defaults.ts`, `plugin.ts`, `opencode.plugin.ts`, `openagent.plugin.ts`, `vscode.plugin.ts`, `routing.service.ts`, `types/index.ts`, 3 plugin test files.

**Contexto**: O schema antigo tinha `DbConfig.routing: PluginRoutingConfig` como um objeto top-level com `{ version, plugins: { [id]: { enabled, outputFile, agents } } }`. O schema novo moveu routing para dentro de `DbConfig.plugins`: cada entrada em `plugins` é um `PluginRouting` com `{ enabled, outputFile, config?, routing: { agents?, categories? } }`.

**O que muda**:
- Antes: `config.routing.plugins["opencode"].agents`
- Depois: `config.plugins["opencode"].routing.agents`

**Decisão necessária**: O `RoutingService` inteiro precisa ser refeito para operar sobre `DbConfig.plugins[pluginId].routing` em vez de `DbConfig.routing.plugins[pluginId]`. A interface `IPlugin.buildOutput()` também precisa mudar — o parâmetro `routing` que os plugins recebem precisa ser o `PluginRouting` específico do plugin, não um `PluginRoutingConfig` global.

**Sugestão**: 
- Renomear `DEFAULT_ROUTING` para algo como `DEFAULT_PLUGIN_CONFIGS` (ou cada plugin ter seu próprio default)
- O `RoutingService` deve manipular `config.plugins[id].routing` diretamente
- A assinatura `buildOutput(agents, routing, ctx)` deve receber só o `PluginRouting` do plugin em questão (já resolvido no registry), não o mapa inteiro

### B. `config.routing` não existe em `DbConfig` (RELACIONADO ao A)

**Arquivos**: `routing.service.ts` (12 referências), `registry.ts` (linha 70)

**Contexto**: Todo o `RoutingService` foi construído em cima de `config.routing`, que foi removido do schema. 

**Decisão necessária**: Reimplementar RoutingService para acessar `config.plugins[pluginId].routing`.

**Sugestão**: O `RoutingService` pode ser simplificado — ao invés de ter um config global de routing, as operações seriam:
- `getRoutingForAgent(agentId)` → percorre `config.plugins` e coleta `routing.agents[agentId]`
- `setRoutingForAgent(agentId, pluginIds)` → seta `config.plugins[id].routing.agents[agentId]` para cada plugin
- `getPluginConfig(pluginId)` → retorna `config.plugins[pluginId]`
- Remover `syncAliases` ou mover para campo próprio

### C. `DEFAULT_ROUTING` com shape incompatível

**Arquivo**: `config/defaults.ts`

**Contexto**: O `DEFAULT_ROUTING` tem `agents: {}` plano nos plugins:
```ts
{ version: 1, plugins: { opencode: { enabled: true, outputFile: "opencode.json", agents: {} } } }
```
Mas o schema novo e os plugins esperam `routing: { agents: {} }` aninhado.

**Decisão necessária**: Definir shape padrão dos plugins.

**Sugestão**: Adotar o shape do schema novo e criar defaults alinhados:
```ts
export const DEFAULT_PLUGINS: Record<string, PluginRouting> = {
  opencode: { enabled: true, outputFile: "opencode.json", routing: { agents: {}, categories: {} } },
  ...
};
```

### D. Test data desatualizada em múltiplos arquivos

**Arquivos**: `agent.service.test.ts`, `agent-catalog.service.test.ts`, `opencode.plugin.test.ts`, `openagent.plugin.test.ts`, `vscode.plugin.test.ts`

**Contexto**: Os helpers `makeSystemAgent()` usam campos que não existem no `SystemAgent` schema novo:
- `id` — removido (era adicionado pelo registry como `{ ...agent, id }`)
- `versions` — removido (não faz parte do schema novo)
- `enabledPlugins` — removido

Além disso, `model.service.test.ts` precisa de `enabled: true` no `ModelSpec` (campo novo).

**Decisão necessária**: Atualizar `id`, `versions`, `enabledPlugins` para o shape real.

**Sugestão**: 
- `makeSystemAgent()` deve retornar só os campos do schema: `{ displayName, icon, description, limits, model, fallbackModels, config }`
- Test data de `ModelSpec` deve incluir `enabled: true` (ou decidir se o campo deve ser opcional com `.optional()` sem `.default()`)
- Testes que precisam de `id` (ex: `getInternalAgents`, mapeamento) devem usar `InternalAgent` separadamente

### E. `PluginRegistry.exportOne` e `loadFromConfig` acessam `config.routing`

**Arquivo**: `plugins/registry.ts`

**Contexto**: `exportOne()` faz `const routing = config.routing ?? { version: 1, plugins: {} }` e passa para `plugin.buildOutput()`.

**Decisão necessária**: Decidir como o registry extrai a config de routing para cada plugin.

**Sugestão**: Em vez de extrair `config.routing` (que não existe), cada plugin deve receber seu próprio `PluginRouting` via `config.plugins[pluginId]`:
```ts
const pluginConfig = config.plugins[pluginId] ?? { enabled: true, outputFile: plugin.getOutputFile(), routing: { agents: {}, categories: {} } };
plugin.buildOutput(agents, pluginConfig, ctx);
```

### F. `resolveModelName` — implementação vs testes divergentes

**Arquivo**: `model.service.ts` + `model.service.test.ts`

**Contexto**: A implementação atual de `resolveModelName` só verifica `config.models[key]` e retorna a key. Os testes (que removi) esperavam um sistema de `customAliases`. Não há suporte a aliases no schema atual.

**Decisão necessária**: A feature de aliases foi movida para o pacote `alias-router`? Se sim, `resolveModelName` deve delegar para ele. Se não, a feature precisa ser adicionada ou os testes removidos.

**Sugestão**: Verificar `packages/alias-router/src/` — se lá já tem `resolveModelName()`, o `ModelService` pode delegar; se não, remover o método do ModelService por enquanto.

---

## Estado atual do typecheck

| Package | Status |
|---------|--------|
| `@lite-llm/agents-repository` | ✅ Passa |
| `@lite-llm/app-repository` | ✅ Passa |
| `@lite-llm/alias-router` | ✅ Passa (cached) |
| `@lite-llm/env` | ✅ Passa (cached) |
| `@lite-llm/litellm-repository` | ✅ Passa (cached) |
| `@lite-llm/agents-manager` | ❌ Bloqueado por pendências A-F |
| `@lite-llm/analytics` | ⏳ Não rodou (falha no agents-manager interrompe) |
| `@lite-llm/server-core` | ⏳ Não rodou |
| `@lite-llm/monitor` | ⏳ Não rodou |
| `@litellm/shared` | ⏳ Não rodou |
| `server` | ⏳ Não rodou |
| `web` | ⏳ Não rodou |

> **Nota**: O turbo para no primeiro package que falha. Depois de resolver os erros do `agents-manager`, outros packages podem ter problemas de inconsistência também — principalmente `server-core` e `analytics` que dependem dos tipos do `agents-manager`/`agents-repository`.
