# @lite-llm/agents-manager — Migração para Arquitetura Genérica

## Visão Geral

Este documento descreve a migração do formato atual (acoplado ao oh-my-opencode) para a nova arquitetura genérica com roteamento de plugins.

## Formato Atual vs Novo

### Formato Atual (`@storage/agents.json`)

```json
{
  "version": 1,
  "litellm": { "baseUrl": "...", "apiKey": "..." },
  "models": { ... },
  "agents": {
    "sisyphus": {
      "model": "deepseek-v4-flash",
      "fallbackModels": ["glm-5.1", "qwen3.5-plus"],
      "description": "...",
      "color": "#C83232"
    }
  },
  "categories": { ... }
}
```

**Problemas:**
- `AGENT_VERSIONS` hard-coded em plugins
- Limites fixos em `buildAgentModels()`
- Plugins assumem formato oh-my-opencode

### Novo Formato

```json
{
  "catalog": {
    "version": 1,
    "litellm": { "baseUrl": "...", "apiKey": "..." },
    "models": { ... },
    "agents": {
      "sisyphus": {
        "id": "sisyphus",
        "displayName": "Sisyphus",
        "description": "...",
        "color": "#C83232",
        "versions": [...],           // Não mais aqui
        "defaultVersion": "gpt-5.5", // Não mais aqui
        "enabledPlugins": ["opencode", "openagent"],
        "config": { ... }
      }
    },
    "categories": { ... }
  },
  "routing": {
    "version": 1,
    "globalFallbackAgent": "builder",
    "rules": {
      "sisyphus": [
        {
          "pluginId": "opencode",
          "enabled": true,
          "modelIdStrategy": {
            "pattern": "{agentId}/{version}",
            "versions": ["gpt-5.5", "gpt-5.4", "gpt-5.3", "gpt-5.2", "gpt-5.1"]
          },
          "limits": { "context": 200000, "output": 32768 }
        }
      ]
    }
  }
}
```

## Plano de Migração

### Fase 1: Preparação

1. **Backup do arquivo atual**
   ```bash
   cp @storage/agents.json @storage/agents.json.bak
   ```

2. **Criar estrutura de diretórios**
   ```typescript
   // packages/agents-manager/src/types/ (novo)
   // packages/agents-manager/src/routing/ (novo)
   ```

### Fase 2: Novos Tipos

1. Criar `packages/agents-manager/src/types/`:
   - `catalog.ts` — AgentCatalog, SystemAgent, AgentVersion
   - `routing.ts` — AgentRoutingConfig, PluginRoutingRule
   - `plugin.ts` — IPlugin, GeneratedVersion (atualizar existente)

2. Criar `packages/agents-manager/src/routing/`:
   - `routing.service.ts` — IRoutingService
   - `migration.ts` — Conversão de formato antigo

### Fase 3: Services Atualizados

1. **AgentService** — retorna `SystemAgent` em vez de `DbAgentEntry`
2. **CategoryService** — idem
3. **Novo RoutingService** — gerencia `AgentRoutingConfig`

### Fase 4: Plugins Refatorados

1. **Remover hard-coded:**
   ```typescript
   // ANTES (opencode.plugin.ts)
   const AGENT_VERSIONS = ["gpt-5.5", "gpt-5.4", ...];

   // DEPOIS - usar rule.modelIdStrategy.versions
   ```

2. **Implementar `generateVersions()`:**
   ```typescript
   generateVersions(agent: SystemAgent, rule: PluginRoutingRule): GeneratedVersion[] {
     return rule.modelIdStrategy.versions.map(version => ({
       id: rule.modelIdStrategy.pattern
         .replace("{agentId}", agent.id)
         .replace("{version}", version),
       displayName: `${agent.displayName} ${version}`,
       isDefault: version === rule.modelIdStrategy.versions[0],
       limits: rule.limits
     }));
   }
   ```

3. **Plugins Builtin:**
   - `OpenCodePlugin` — usa `{agentId}/{version}`
   - `OpenAgentPlugin` — usa `{agentId}/{version}`
   - `VsCodePlugin` — usa `{agentId}-{version}`, versões limitadas

### Fase 5: Migration Layer

```typescript
// packages/agents-manager/src/routing/migration.ts

export function migrateLegacyConfig(legacy: LegacyDbConfig): AgentsConfigFile {
  const catalog: AgentCatalog = {
    version: 1,
    litellm: legacy.litellm,
    models: legacy.models,
    agents: {},
    categories: legacy.categories,
    globalFallbackAgent: legacy.globalFallbackModel,
  };

  // Migrar agentes
  for (const [key, entry] of Object.entries(legacy.agents)) {
    catalog.agents[key] = {
      id: key,
      displayName: key, // TODO: futuramente ter displayName configurável
      description: entry.description || "",
      color: entry.color || "#555555",
      enabledPlugins: ["opencode", "openagent"], // Default
      versions: [], // Gerenciado pelo routing
      defaultVersion: "gpt-5.5",
      config: {
        model: entry.model,
        fallbackModels: entry.fallbackModels,
        disable: entry.disable,
        mode: entry.mode,
        tools: entry.tools,
        permission: entry.permission,
      },
    };
  }

  // Gerar routing padrão
  const routing = generateDefaultRouting(Object.keys(legacy.agents));

  return { catalog, routing };
}

function generateDefaultRouting(agentIds: string[]): AgentRoutingConfig {
  const rules: Record<string, PluginRoutingRule[]> = {};

  const defaultVersions = ["gpt-5.5", "gpt-5.4", "gpt-5.3", "gpt-5.2", "gpt-5.1"];

  for (const agentId of agentIds) {
    rules[agentId] = [
      {
        pluginId: "opencode",
        enabled: true,
        modelIdStrategy: {
          pattern: "{agentId}/{version}",
          versions: defaultVersions,
        },
        limits: { context: 200000, output: 32768 },
      },
      {
        pluginId: "openagent",
        enabled: true,
        modelIdStrategy: {
          pattern: "{agentId}/{version}",
          versions: defaultVersions,
        },
      },
      {
        pluginId: "vscode",
        enabled: true,
        modelIdStrategy: {
          pattern: "{agentId}-{version}",
          versions: ["gpt-5.5", "gpt-5.4"],
        },
        limits: { output: 32768 },
      },
    ];
  }

  return {
    version: 1,
    globalFallbackAgent: "builder",
    rules,
  };
}
```

### Fase 6: Atualização do Repository

```typescript
// packages/agents-manager/src/repository/client.ts

export async function read(): Promise<AgentsConfigFile> {
  // Detectar formato antigo vs novo
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw);

  if ("agents" in parsed && !("catalog" in parsed)) {
    // Formato legado - migrar
    return migrateLegacyConfig(parsed as LegacyDbConfig);
  }

  return parsed as AgentsConfigFile;
}
```

### Fase 7: Backward Compatibility (Opcional)

Se precisar manter compatibilidade com o formato antigo:

```typescript
// packages/agents-manager/src/repository/legacy.ts

export function toLegacyFormat(catalog: AgentCatalog): LegacyDbConfig {
  const legacy: LegacyDbConfig = {
    version: catalog.version,
    litellm: catalog.litellm,
    models: catalog.models,
    agents: {},
    categories: {},
    globalFallbackModel: catalog.globalFallbackAgent,
  };

  for (const [key, agent] of Object.entries(catalog.agents)) {
    legacy.agents[key] = {
      model: agent.config.model,
      fallbackModels: agent.config.fallbackModels,
      description: agent.description,
      color: agent.color,
      disable: agent.config.disable,
      tools: agent.config.tools,
      mode: agent.config.mode,
      permission: agent.config.permission,
    };
  }

  return legacy;
}
```

## Critérios de Aceite

1. ✅ Arquivo `@storage/agents.json` migrado para novo formato
2. ✅ `AGENT_VERSIONS` removido de plugins (config-driven)
3. ✅ Limites hard-coded removidos (vem de `PluginRoutingRule.limits`)
4. ✅ `RoutingService` implementado e testado
5. ✅ Migration layer para formato legado funcional
6. ✅ Todos os plugins geram output idêntico ao formato anterior
7. ✅ CRUD de agentes funciona com novos tipos

## Riscos e Mitigações

| Risco                           | Mitigação                                  |
| ------------------------------- | ------------------------------------------ |
| Perda de dados na migração      | Backup prévio + validação de schema        |
| Breaking change em consumidores | Migration layer + backward compat optional |
| Output diferente do esperado    | Testes de regressão com snapshots          |
