# Design: Refatoração Routing pós-reforma dos schemas

**Data:** 2026-05-11
**Status:** Aprovado
**Motivação:** O schema do `@lite-llm/agents-repository` foi reformado — routing mudou de objeto top-level (`DbConfig.routing`) para dados aninhados em `DbConfig.plugins[id].routing`. Tudo que dependia do modelo antigo quebrou.

---

## 1. Escopo

6 subsistemas em `packages/agents-manager/src/`:
1. Tipos — remover `PluginRoutingConfig`, usar `PluginRouting` do schema
2. Plugin interface — `buildOutput` recebe `PluginRouting` específico
3. Defaults — `DEFAULT_ROUTING` substituído por defaults por plugin
4. `RoutingService` — opera sobre `config.plugins[id].routing`
5. `PluginRegistry` — `exportOne`/`loadFromConfig` ajustados
6. Test data — `makeSystemAgent`, mock repos, `ModelSpec` shape atualizados

---

## 2. Decisões de design

### 2.1 Tipos

- `PluginRoutingConfig` removido dos exports. Não existe no schema novo.
- `plugin.ts`: parâmetro `routing` de `buildOutput` muda para `PluginRouting` (importado de `@lite-llm/agents-repository/schemas`).
- `plugin.ts`: `IPluginRegistry.loadFromConfig` recebe `Record<string, PluginRouting>` (o mapa de pluginId → config, equivalente a `DbConfig.plugins`).
- `types/index.ts`: não re-exporta mais `PluginRoutingConfig` (que não existe). Se precisar exportar `PluginRouting`, importa direto de `@lite-llm/agents-repository/schemas`.

### 2.2 Plugin interface + defaults

- `IPlugin.buildOutput(agents, routing: PluginRouting, ctx)` — cada plugin recebe só sua própria config, não o mapa global.
- `DEFAULT_ROUTING` removido de `config/defaults.ts`.
- Plugins que precisam de defaults usam um fallback inline no registry/consumer: `config.plugins?.[pluginId] ?? { enabled: true, outputFile: plugin.getOutputFile(), routing: { agents: {}, categories: {} } }`.
- Código dos plugins muda:
  - `routing.plugins[this.id]` → `routing` (já vem resolvido)
  - `pluginRouting?.routing?.agents` → `routing.routing?.agents`
  - `pluginRouting?.config` → `routing.config`

### 2.3 RoutingService

Interface nova:

```ts
interface IRoutingService {
  getPluginsForAgent(agentId: string): Promise<string[]>;
  setPluginsForAgent(agentId: string, pluginIds: string[]): Promise<void>;
  toggleAgentPlugin(pluginId: string, agentId: string): Promise<boolean>;
  isPluginEnabled(pluginId: string, agentId: string): Promise<boolean>;
  getPluginConfig(pluginId: string): Promise<PluginRouting | undefined>;
  savePluginConfig(pluginId: string, config: PluginRouting): Promise<void>;
  getAgentMappings(pluginId: string): Promise<Record<string, string>>;
  saveAgentMappings(pluginId: string, mappings: Record<string, string>): Promise<void>;
  getCategoryMappings(pluginId: string): Promise<Record<string, boolean>>;
  saveCategoryMappings(pluginId: string, mappings: Record<string, boolean>): Promise<void>;
  toggleCategoryMapping(pluginId: string, categoryId: string): Promise<boolean>;
}
```

Mudanças:
- `getConfig()`/`saveConfig()` → `getPluginConfig(pluginId)`/`savePluginConfig(pluginId, config)` — opera num plugin específico
- `getRoutingForAgent` → `getPluginsForAgent` — caminho: `config.plugins[id].routing.agents[agentId]`
- `setRoutingForAgent` → `setPluginsForAgent`
- `getSyncAliases`/`setSyncAliases` removidos — não existem no schema novo
- Demais métodos mantêm semântica mas com caminho de acesso atualizado: `config.plugins[id].routing.*`

### 2.4 PluginRegistry

- `exportOne(pluginId)`:
  - Antes: `const routing = config.routing ?? { version: 1, plugins: {} }; plugin.buildOutput(agents, routing, ctx);`
  - Depois: `const pluginConfig = config.plugins?.[pluginId] ?? fallback; plugin.buildOutput(agents, pluginConfig, ctx);`
- `loadFromConfig`:
  - Antes: `loadFromConfig(routing: PluginRoutingConfig)`
  - Depois: `loadFromConfig(pluginConfigs: Record<string, PluginRouting>)`
  - Quem chama: passa `config.plugins` (extraído de `DbConfig`)

### 2.5 Test data

- `makeSystemAgent()`: remove `id`, `versions`, `enabledPlugins` — não existem no schema novo. Shape final: `{ displayName, icon, description, limits: { context, output }, model, fallbackModels, config }`.
- `ModelSpec` em testes: adicionar `enabled: true` (campo novo obrigatório) e `limits: { length, maxOutput }` (substitui `contextLength`/`maxOutput` planos).
- Mock repos: campo `litellm` → `provider: { litellm: { name, ownedBy, baseUrl, apiKey } }`.
- Plugin tests: routing inline nos testes deve usar shape `{ enabled, outputFile, routing: { agents?, categories? } }`.

---

## 3. Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `packages/agents-manager/src/plugins/plugin.ts` | Tipo do parâmetro `routing`, interface `IPluginRegistry` |
| `packages/agents-manager/src/plugins/registry.ts` | `exportOne`, `loadFromConfig`, `buildContext` |
| `packages/agents-manager/src/plugins/builtins/opencode.plugin.ts` | Assinatura `buildOutput`, acesso a `model.limits.*` |
| `packages/agents-manager/src/plugins/external/openagent.plugin.ts` | Assinatura `buildOutput` |
| `packages/agents-manager/src/plugins/external/vscode.plugin.ts` | Assinatura `buildOutput`, acesso a `model.limits.*` |
| `packages/agents-manager/src/config/defaults.ts` | Remove `DEFAULT_ROUTING` |
| `packages/agents-manager/src/types/index.ts` | Remove re-export `PluginRoutingConfig` |
| `packages/agents-manager/src/services/routing.service.ts` | Reimplementação completa |
| `packages/agents-manager/src/services/model.service.ts` | Referências a `ModelSpec` (já ok) |
| `packages/agents-manager/src/services/__tests__/model.service.test.ts` | Shape `ModelSpec`, mock repo |
| `packages/agents-manager/src/services/__tests__/category.service.test.ts` | Já fixado parcialmente, mock repo |
| `packages/agents-manager/src/services/__tests__/agent.service.test.ts` | `makeSystemAgent`, mock repo |
| `packages/agents-manager/src/services/__tests__/agent-catalog.service.test.ts` | `makeSystemAgent`, mock repo |
| `packages/agents-manager/src/services/__tests__/routing.service.test.ts` | Reescrita para nova interface |
| `packages/agents-manager/src/plugins/__tests__/opencode.plugin.test.ts` | Routing inline shape, `ModelSpec` shape |
| `packages/agents-manager/src/plugins/__tests__/openagent.plugin.test.ts` | Routing inline shape, `makeSystemAgent` |
| `packages/agents-manager/src/plugins/__tests__/vscode.plugin.test.ts` | Routing inline shape, `ModelSpec` shape |
| `packages/agents-manager/src/index.ts` | Re-export de tipos |

---

## 4. Não-mudanças (fora de escopo)

- `packages/alias-router/` — não foi afetado (não depende dos schemas de routing)
- `apps/server/` e `apps/web/` — podem precisar de ajustes se consomem `RoutingService`, mas isso é detectado no typecheck após a refatoração
- Schema do `@lite-llm/agents-repository` — não mexe, é a âncora

---

## 5. Ordem de implementação sugerida

1. Tipos + plugin interface (`plugin.ts`, `types/index.ts`)
2. Defaults (`defaults.ts`)
3. Plugins source (`opencode.plugin.ts`, `openagent.plugin.ts`, `vscode.plugin.ts`)
4. `PluginRegistry` (`registry.ts`)
5. `RoutingService` (`routing.service.ts`)
6. Tests (todos os `__tests__/`)
7. `index.ts` (barrel exports)
8. `pnpm typecheck` + `pnpm test` no `agents-manager`
9. Typecheck full monorepo
