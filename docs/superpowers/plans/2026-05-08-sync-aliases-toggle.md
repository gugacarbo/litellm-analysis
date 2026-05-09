# Alternar Sincronização de Aliases — Plano de Implementação

> **Para workers agentic:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um interruptor na UI para desabilitar a sincronização automática de aliases do LiteLLM ao alterar agentes/categorias.

**Architecture:** A configuração `syncAliases` é armazenada em `routing.syncAliases` em `@settings/agents.json`, lida via `RoutingService` no backend. O frontend carrega o valor via React Query, armazena em estado local, e passa para as mutations de update/delete. Um Switch no cabeçalho da página permite alternar o valor, persistindo via API.

**Tech Stack:** Express.js, React 19, React Query, shadcn/ui (Switch + Tooltip)

---

### Task 1: RoutingService — métodos syncAliases

**Files:**
- Modify: `packages/agents-manager/src/services/routing.service.ts`
- Test: `packages/agents-manager/src/services/__tests__/routing.service.test.ts` (criar)

- [ ] **Step 1: Criar teste para `getSyncAliases` com valor padrão**

```typescript
// packages/agents-manager/src/services/__tests__/routing.service.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { RoutingService } from "../routing.service";
import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { DbConfig } from "@lite-llm/agents-repository/schema";

function createMockRepository(data: Partial<DbConfig> = {}): IAgentsRepository {
  let store: DbConfig = {
    version: 2,
    models: {},
    systemAgents: {},
    routing: { version: 1, plugins: {} },
    ...data,
  } as DbConfig;

  return {
    read: async () => store,
    write: async (config: DbConfig) => {
      store = config;
    },
  } as IAgentsRepository;
}

describe("RoutingService", () => {
  describe("syncAliases", () => {
    it("retorna false quando syncAliases está ausente", async () => {
      const repo = createMockRepository({
        routing: { version: 1, plugins: {} },
      });
      const service = new RoutingService({ repository: repo });
      const result = await service.getSyncAliases();
      expect(result).toBe(false);
    });

    it("retorna o valor armazenado quando presente", async () => {
      const repo = createMockRepository({
        routing: { version: 1, plugins: {}, syncAliases: true },
      });
      const service = new RoutingService({ repository: repo });
      const result = await service.getSyncAliases();
      expect(result).toBe(true);
    });

    it("persiste o valor com setSyncAliases", async () => {
      const repo = createMockRepository();
      const service = new RoutingService({ repository: repo });
      await service.setSyncAliases(true);
      const result = await service.getSyncAliases();
      expect(result).toBe(true);
      await service.setSyncAliases(false);
      const result2 = await service.getSyncAliases();
      expect(result2).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Rodar teste para verificar falha**

Run: `pnpm --filter @lite-llm/agents-manager vitest run src/services/__tests__/routing.service.test.ts`
Expected: FAIL — `getSyncAliases` not defined

- [ ] **Step 3: Implementar métodos no RoutingService**

```typescript
// Adicionar ao IRoutingService (antes de export class RoutingService)
export interface IRoutingService {
  getConfig(): Promise<PluginRoutingConfig>;
  saveConfig(config: PluginRoutingConfig): Promise<void>;
  getRoutingForAgent(agentId: string): Promise<string[]>;
  setRoutingForAgent(agentId: string, pluginIds: string[]): Promise<void>;
  toggleAgentPlugin(pluginId: string, agentId: string): Promise<boolean>;
  isPluginEnabled(pluginId: string, agentId: string): Promise<boolean>;
  // NOVOS
  getSyncAliases(): Promise<boolean>;
  setSyncAliases(enabled: boolean): Promise<void>;
}
```

```typescript
// Adicionar à classe RoutingService (após isPluginEnabled)
async getSyncAliases(): Promise<boolean> {
  const config = (await this.repository.read()) as DbConfig;
  if (!config.routing) return false;
  return (config.routing as Record<string, unknown>).syncAliases === true;
}

async setSyncAliases(enabled: boolean): Promise<void> {
  const config = (await this.repository.read()) as DbConfig;
  if (!config.routing) {
    config.routing = { version: 1, plugins: {} } as unknown as Record<string, unknown>;
  }
  (config.routing as Record<string, unknown>).syncAliases = enabled;
  await this.repository.write(config as DbConfig);
}
```

- [ ] **Step 4: Rodar testes para verificar passam**

Run: `pnpm --filter @lite-llm/agents-manager vitest run src/services/__tests__/routing.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/agents-manager/src/services/routing.service.ts packages/agents-manager/src/services/__tests__/routing.service.test.ts
git commit -m "feat(agents-manager): add getSyncAliases/setSyncAliases to RoutingService"
```

---

### Task 2: Backend — Rota sync-aliases API

**Files:**
- Create: `packages/server-core/src/routes/agent-config/sync-aliases-routes.ts`
- Modify: `packages/server-core/src/routes/agent-config/agent-config-routes.ts` (registrar nova rota)

- [ ] **Step 1: Criar arquivo de rota sync-aliases**

```typescript
// packages/server-core/src/routes/agent-config/sync-aliases-routes.ts
import { createAgentsManager } from "@lite-llm/agents-manager";
import type { Application } from "express";
import type { RouteOptions } from "../../types/index.js";

export function registerSyncAliasesRoutes(
  app: Application,
  _opts: RouteOptions,
): void {
  app.get("/agent-config/sync-aliases", async (_req, res) => {
    try {
      const { services } = createAgentsManager();
      const enabled = await services.routing.getSyncAliases();
      res.json({ enabled });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/agent-config/sync-aliases", async (req, res) => {
    try {
      const { enabled } = req.body as { enabled?: boolean };
      const { services } = createAgentsManager();
      await services.routing.setSyncAliases(enabled === true);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
```

- [ ] **Step 2: Registrar rota em agent-config-routes.ts**

```typescript
// packages/server-core/src/routes/agent-config-routes.ts
import { registerConfigRoutes } from "./agent-config/config-routes.js";
import { registerGlobalFallbackRoutes } from "./agent-config/global-fallback-routes.js";
import { registerItemRoutes } from "./agent-config/item-routes.js";
import { registerSyncAliasesRoutes } from "./agent-config/sync-aliases-routes.js"; // NOVO

export function registerAgentConfigRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  registerGlobalFallbackRoutes(app, opts);
  registerConfigRoutes(app, opts);
  registerItemRoutes(app, opts);
  registerSyncAliasesRoutes(app, opts); // NOVO
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/server-core/src/routes/agent-config/sync-aliases-routes.ts packages/server-core/src/routes/agent-config-routes.ts
git commit -m "feat(server-core): add GET/PUT /agent-config/sync-aliases routes"
```

---

### Task 3: Backend — Save All e DELETE respeitam syncAliases

**Files:**
- Modify: `packages/server-core/src/routes/agent-config/config-routes.ts`
- Modify: `packages/server-core/src/routes/agent-config/item-routes.ts`

- [ ] **Step 1: Config-routes — condicionar alias regeneration no Save All**

```typescript
// packages/server-core/src/routes/agent-config/config-routes.ts
// Substituir no final, ANTES de res.json({ success: true }):
      await orchestration.syncGeneratedArtifacts();

      const { services } = createAgentsManager();
      const syncAliases = await services.routing.getSyncAliases();
      if (syncAliases) {
        await orchestration.regenerateAllAliases();
      }

      res.json({ success: true });
```

- [ ] **Step 2: Item-routes — condicionar deleção de aliases no DELETE**

```typescript
// packages/server-core/src/routes/agent-config/item-routes.ts
// SUBSTITUIR no DELETE /agent-config/:key, depois de syncGeneratedArtifacts:
      await orchestration.syncGeneratedArtifacts();

      const { services } = createAgentsManager();
      const syncAliases = await services.routing.getSyncAliases();

      if (syncAliases) {
        const { getAgentRoutingConfig, updateAgentRoutingConfig } = dataSource;
        const existingRouting = await getAgentRoutingConfig();
        const existingAliases = existingRouting?.model_group_alias
          ? (existingRouting.model_group_alias as Record<string, string>)
          : {};
        const keysToRemove = getExistingAliasesForAgent(key, existingAliases);
        const deletions: Record<string, string> = {};
        for (const aliasKey of keysToRemove) {
          deletions[aliasKey] = "";
        }
        await updateAgentRoutingConfig(deletions);
      }

      res.json({ success: true });
```

- [ ] **Step 3: Commit**

```bash
git add packages/server-core/src/routes/agent-config/config-routes.ts packages/server-core/src/routes/agent-config/item-routes.ts
git commit -m "feat(server-core): respect syncAliases flag in Save All and DELETE"
```

---

### Task 4: Frontend — API client e query keys

**Files:**
- Modify: `apps/web/src/lib/query-keys.ts`
- Modify: `apps/web/src/lib/api-client/agent-config.ts`

- [ ] **Step 1: Adicionar query key syncAliases**

```typescript
// apps/web/src/lib/query-keys.ts
// Adicionar ao objeto queryKeys:
  syncAliases: ["sync-aliases"] as const,
```

- [ ] **Step 2: Adicionar funções no API client**

```typescript
// apps/web/src/lib/api-client/agent-config.ts
// Adicionar ao final do arquivo:

export async function getSyncAliasesConfig(): Promise<{ enabled: boolean }> {
  return fetchApi("/agent-config/sync-aliases");
}

export async function setSyncAliasesConfig(
  enabled: boolean,
): Promise<{ success: boolean }> {
  return fetchApi("/agent-config/sync-aliases", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
}
```

(Re-export é automático via `export *` em `api-client.ts`)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/query-keys.ts apps/web/src/lib/api-client/agent-config.ts
git commit -m "feat(web): add syncAliases query key and API client functions"
```

---

### Task 5: Frontend — State hook e Actions hook

**Files:**
- Modify: `apps/web/src/pages/agent-routing/use-agent-routing-state.ts`
- Modify: `apps/web/src/pages/agent-routing/use-agent-routing-actions.ts`

- [ ] **Step 1: State hook — adicionar syncAliases state + query**

```typescript
// apps/web/src/pages/agent-routing/use-agent-routing-state.ts
// ADICIONAR import:
import { getSyncAliasesConfig } from "../../lib/api-client";

// ADICIONAR no corpo do hook:
  const [syncAliases, setSyncAliases] = useState<boolean>(false);

  const syncAliasesQuery = useQuery({
    queryKey: queryKeys.syncAliases,
    queryFn: getSyncAliasesConfig,
  });

// ADICIONAR useEffect para sincronizar:
  useEffect(() => {
    if (syncAliasesQuery.data !== undefined) {
      setSyncAliases(syncAliasesQuery.data.enabled);
    }
  }, [syncAliasesQuery.data]);

// ADICIONAR ao retorno:
    syncAliases,
    setSyncAliases,
```

- [ ] **Step 2: Actions hook — aceitar syncAliases + toggle handler**

```typescript
// apps/web/src/pages/agent-routing/use-agent-routing-actions.ts
// ADICIONAR import:
import { setSyncAliasesConfig } from "../../lib/api-client";

// ALTERAR assinatura da função:
export function useAgentRoutingActions(
  _aliases: Record<string, string>,
  setAliases: SetAliases,
  agentConfigs: Record<string, AgentConfig>,
  setAgentConfigs: SetAgentConfigs,
  categoryConfigs: Record<string, CategoryConfig>,
  setCategoryConfigs: SetCategoryConfigs,
  _globalFallbackModel: string,
  setGlobalFallbackModel: SetGlobalFallbackModel,
  syncAliases: boolean, // NOVO
  setSyncAliases: (value: boolean) => void, // NOVO
) {

// ALTERAR mutationFn para usar syncAliases:
  const updateAgentConfigMutation = useMutation({
    mutationFn: (params: {
      key: string;
      type: "agent" | "category";
      config: AgentConfig | CategoryConfig;
    }) => updateAgentConfig(params.key, params.type, params.config, syncAliases),
  });

// ADICIONAR callback handleToggleSyncAliases (após handleSaveGlobalFallback):
  const handleToggleSyncAliases = useCallback(
    async (enabled: boolean) => {
      setSyncAliases(enabled); // Atualização otimista
      try {
        await setSyncAliasesConfig(enabled);
        await queryClient.invalidateQueries({
          queryKey: queryKeys.syncAliases,
        });
      } catch {
        setSyncAliases(!enabled); // Reverter em caso de erro
      }
    },
    [queryClient, setSyncAliases],
  );

// ADICIONAR ao retorno:
    handleToggleSyncAliases,
    syncAliases,
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/agent-routing/use-agent-routing-state.ts apps/web/src/pages/agent-routing/use-agent-routing-actions.ts
git commit -m "feat(web): add syncAliases state and actions to agent-routing hooks"
```

---

### Task 6: Frontend — Page hook e Page component

**Files:**
- Modify: `apps/web/src/pages/agent-routing/use-agent-routing-page.ts`
- Modify: `apps/web/src/pages/agent-routing.tsx`

- [ ] **Step 1: Page hook — passar syncAliases adiante**

```typescript
// apps/web/src/pages/agent-routing/use-agent-routing-page.ts
// NO DESTRUCTURE de useAgentRoutingState():
  const {
    ...
    syncAliases, // NOVO
    setSyncAliases, // NOVO
  } = useAgentRoutingState();

// NA CHAMADA de useAgentRoutingActions(), ADICIONAR ao final dos args:
    syncAliases,
    setSyncAliases,

// NO RETORNO do hook, ADICIONAR:
    syncAliases,
    handleToggleSyncAliases,
```

- [ ] **Step 2: Page component — adicionar Switch**

```typescript
// apps/web/src/pages/agent-routing.tsx
// ADICIONAR imports:
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";

// DESTRUCTURAR do state:
  const {
    ...
    syncAliases,
    handleToggleSyncAliases,
  } = state;

// NO JSX, entre o <TabsList> e <GlobalFallbackSelector>, ADICIONAR:
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    id="sync-aliases"
                    checked={syncAliases}
                    onCheckedChange={handleToggleSyncAliases}
                  />
                  <Label htmlFor="sync-aliases" className="text-sm cursor-pointer">
                    Sync Aliases
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-48 text-xs">
                  Quando desativado, alterações em agentes e categorias não
                  geram mudanças nos aliases do LiteLLM
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
```

Note: Certifique-se de que o JSX resultante fica assim:

```tsx
      <Tabs defaultValue="agents">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="model-stations">
              <Layers className="h-4 w-4 me-1.5" />
              Model Stations
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      id="sync-aliases"
                      checked={syncAliases}
                      onCheckedChange={handleToggleSyncAliases}
                    />
                    <Label htmlFor="sync-aliases" className="text-sm cursor-pointer">
                      Sync Aliases
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-48 text-xs">
                    Quando desativado, alterações em agentes e categorias não
                    geram mudanças nos aliases do LiteLLM
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <GlobalFallbackSelector
              value={state.globalFallbackModel}
              onValueChange={state.handleSaveGlobalFallback}
            />
          </div>
        </div>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/agent-routing/use-agent-routing-page.ts apps/web/src/pages/agent-routing.tsx
git commit -m "feat(web): add sync-aliases toggle switch to agent-routing page"
```

---

### Task 7: Verificação final

- [ ] **Rodar compilação e testes**

```bash
pnpm typecheck
pnpm test
pnpm build
```

Expected: All passing

- [ ] **Verificar visualmente**

Iniciar dev server: `pnpm dev`
Abrir Agent Routing page → verificar:
1. Switch "Sync Aliases" aparece no cabeçalho entre as abas e o globalFallback
2. Switch está OFF por padrão
3. Alternar liga/desliga persiste (recarregar a página mantém o estado)
4. Com Switch OFF: alterar modelo de agente → aliases não são modificados
5. Com Switch ON: alterar modelo de agente → aliases são sincronizados normalmente
