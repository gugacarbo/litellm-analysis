# UI Agents Manager Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate UI and server routes from old flat AgentConfig/CategoryConfig to new SystemAgent/PluginRoutingConfig architecture, removing ALL legacy code.

**Architecture:** Bottom-up migration: shared types → API contracts → server routes → API client → hooks → components → page. Each task is independently typecheckable. Old types and hardcoded arrays are deleted, not deprecated.

**Tech Stack:** TypeScript, React 19, React Query (TanStack Query), shadcn/ui, Zod, Express.js, Biome 2.x

---

### Task 1: Update shared types — delete old AgentConfig/CategoryConfig, publish new SystemAgent types

**Files:**
- Modify: `packages/shared/src/types/agent-config.ts`
- Modify: `packages/shared/src/index.ts`

The old `agent-config.ts` exports flat `AgentConfig` and `CategoryConfig` Zod schemas. These are used everywhere in the UI, API contracts, and server routes. We must replace them with new types re-exported from `@lite-llm/agents-manager`.

The new types already exist in `packages/agents-manager/src/types/system-agent.ts` and `routing.ts`. We re-export them from shared for convenience. The old Zod schemas are removed.

- [x] **Step 1: Rewrite `packages/shared/src/types/agent-config.ts`**

Replace entire file content with re-exports from agents-manager:

```typescript
// Re-export SystemAgent types from agents-manager
// Old AgentConfig / CategoryConfig types are removed.
// Use SystemAgent for both agents and categories.
export type {
  AgentExtraConfig,
  AgentVersion,
  SystemAgent,
} from "@lite-llm/agents-manager";

export type {
  PluginRoutingConfig,
  PluginRoutingRule,
} from "@lite-llm/agents-manager";
```

- [x] **Step 2: Update `packages/shared/src/index.ts`**

Remove old exports of `agentConfigSchema`, `categoryConfigSchema`, `agentConfigFileSchema`, `ohMyOpenAgentConfigSchema`, and their types. Replace with new re-exports:

```typescript
export type {
  AgentExtraConfig,
  AgentVersion,
  PluginRoutingConfig,
  PluginRoutingRule,
  SystemAgent,
} from "./types/agent-config.js";
```

- [x] **Step 3: Typecheck shared package**

```bash
pnpm --filter @litellm/shared typecheck
```
Expected: FAIL — consumers of old `AgentConfig` / `CategoryConfig` types will break. This is expected; they will be fixed in subsequent tasks.

---

### Task 2: Update API contracts — align with new types, remove hardcoded arrays, remove old alias types

**Files:**
- Modify: `packages/api-contracts/src/agent-routing.ts`
- Modify: `packages/api-contracts/src/agent-catalog.ts`
- Modify: `packages/api-contracts/src/index.ts`

The api-contracts package defines what the server sends to the client. We remove the old flat types entirely and update to match the agents-manager types.

- [x] **Step 1: Rewrite `packages/api-contracts/src/agent-routing.ts`**

Delete everything. Old `AgentRoutingConfig = Record<string, string>`, `AgentDefinitionsResponse`, `AgentDefinition`, `CategoryDefinition`, `AGENT_DEFINITIONS`, `CATEGORY_DEFINITIONS` — all gone. Replace with catalog-based types:

```typescript
import type {
  SystemAgent,
} from "@litellm/shared";

export type { SystemAgent };

// Agent definitions are now fetched from the catalog API.
// The old AGENT_DEFINITIONS / CATEGORY_DEFINITIONS hardcoded
// arrays have been removed.

export interface AgentCatalogResponse {
  agents: SystemAgent[];
}

export interface AgentCatalogDetailResponse {
  agent: SystemAgent;
}
```

- [x] **Step 2: Rewrite `packages/api-contracts/src/agent-catalog.ts`**

Replace the hybrid `SystemAgentDTO` with direct re-export of `SystemAgent`:

```typescript
import type {
  PluginRoutingConfig,
  PluginRoutingRule,
  SystemAgent,
} from "@litellm/shared";

export type { PluginRoutingConfig, PluginRoutingRule, SystemAgent };

export interface PluginInfo {
  id: string;
  name: string;
  builtin: boolean;
  enabled: boolean;
  outputFile: string;
  agentCount: number;
  enabledAgentCount: number;
}

export interface PluginRoutingResponse {
  config: PluginRoutingConfig;
  plugins: PluginInfo[];
}

export interface PluginToggleResponse {
  pluginId: string;
  agentId: string;
  enabled: boolean;
}
```

- [x] **Step 3: Update `packages/api-contracts/src/index.ts`**

No changes needed — it already re-exports from both files. Confirm content is:

```typescript
export * from "./agent-catalog.js";
export * from "./agent-routing.js";
export * from "./analytics.js";
```

- [x] **Step 4: Typecheck api-contracts**

```bash
pnpm --filter @lite-llm/api-contracts typecheck
```
Expected: FAIL — consumers of removed types will break. Expected, will fix next.

---

### Task 3: Update server routes — use SystemAgent catalog API, remove legacy endpoints

**Files:**
- Modify: `packages/server-core/src/routes/agent-config/config-routes.ts`
- Modify: `packages/server-core/src/routes/agent-config/item-routes.ts`
- Modify: `packages/server-core/src/routes/agent-config/global-fallback-routes.ts`
- Modify: `packages/server-core/src/routes/agent-config/sync-aliases-routes.ts`
- Modify: `packages/server-core/src/routes/agent-definitions-routes.ts`
- Modify: `packages/server-core/src/routes/agent-routing-routes.ts`

The old server routes use `AgentEntry`, `CategoryEntry` (flat types from old `@lite-llm/agents-manager`). We replace them with `SystemAgent` catalog endpoints. The old `/agent-config` endpoints become `/agent-catalog`. The alias-based `/agent-routing` endpoint becomes plugin-based `/plugin-routing`.

In `createAgentsManager()`, `services.catalog` provides CRUD for `SystemAgent`, and `services.routing` provides plugin routing.

- [x] **Step 1: Rewrite `config-routes.ts` — catalog CRUD**

Replace entire file. Old file used `AgentEntry`/`CategoryEntry` with `services.agents`/`services.categories`. New file uses `SystemAgent` with `services.catalog`:

```typescript
import { createAgentsManager } from "@lite-llm/agents-manager";
import type { SystemAgent } from "@litellm/shared";
import type { Application } from "express";
import type { RouteOptions } from "../types/index.js";

export function registerConfigRoutes(
  app: Application,
  _opts: RouteOptions,
): void {
  // GET /agent-catalog — list all system agents
  app.get("/agent-catalog", async (_req, res) => {
    try {
      const { services } = createAgentsManager();
      const agents = await services.catalog.getAll();
      const list: SystemAgent[] = Object.values(agents);
      res.json({ agents: list });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /agent-catalog/:id — get single system agent
  app.get("/agent-catalog/:id", async (req, res) => {
    try {
      const { services } = createAgentsManager();
      const agent = await services.catalog.get(req.params.id);
      if (!agent) {
        res.status(404).json({ error: "Agent not found" });
        return;
      }
      res.json({ agent });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // PUT /agent-catalog/:id — create or update system agent
  app.put("/agent-catalog/:id", async (req, res) => {
    try {
      const { services } = createAgentsManager();
      const body = req.body as Partial<SystemAgent>;

      if (!body.displayName) {
        res.status(400).json({ error: "displayName is required" });
        return;
      }
      if (!body.versions || !Array.isArray(body.versions)) {
        res.status(400).json({ error: "versions array is required" });
        return;
      }

      await services.catalog.upsert(req.params.id, body as SystemAgent);

      // Sync generated artifacts (opencode.json etc.)
      const { registry } = createAgentsManager();
      await registry.exportAll();

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // DELETE /agent-catalog/:id — remove system agent
  app.delete("/agent-catalog/:id", async (req, res) => {
    try {
      const { services } = createAgentsManager();
      await services.catalog.delete(req.params.id);

      const { registry } = createAgentsManager();
      await registry.exportAll();

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
```

- [x] **Step 2: Rewrite `plugin-routing` routes (replaces alias-based `/agent-routing`)**

Create a new file or rewrite `agent-routing-routes.ts`:

```typescript
import { createAgentsManager } from "@lite-llm/agents-manager";
import type { Application } from "express";
import type { RouteOptions } from "../types/index.js";

export function registerPluginRoutingRoutes(
  app: Application,
  _opts: RouteOptions,
): void {
  // GET /plugin-routing — get full routing config
  app.get("/plugin-routing", async (_req, res) => {
    try {
      const { services } = createAgentsManager();
      const config = await services.routing.getConfig();
      const { registry } = createAgentsManager();
      const plugins = registry.getAll();
      const pluginInfos = plugins.map((p) => ({
        id: p.id,
        name: p.name,
        builtin: true,
        enabled: config.plugins[p.id]?.enabled ?? false,
        outputFile: p.getOutputFile?.() ?? config.plugins[p.id]?.outputFile ?? "",
        agentCount: Object.keys(config.plugins[p.id]?.agents ?? {}).length,
        enabledAgentCount: Object.values(
          config.plugins[p.id]?.agents ?? {},
        ).filter((r) => r.enabled).length,
      }));
      res.json({ config, plugins: pluginInfos });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /plugin-routing/plugins — list available plugins
  app.get("/plugin-routing/plugins", async (_req, res) => {
    try {
      const { services } = createAgentsManager();
      const config = await services.routing.getConfig();
      const { registry } = createAgentsManager();
      const plugins = registry.getAll();
      const pluginInfos = plugins.map((p) => ({
        id: p.id,
        name: p.name,
        builtin: true,
        enabled: config.plugins[p.id]?.enabled ?? false,
        outputFile: p.getOutputFile?.() ?? config.plugins[p.id]?.outputFile ?? "",
        agentCount: Object.keys(config.plugins[p.id]?.agents ?? {}).length,
        enabledAgentCount: Object.values(
          config.plugins[p.id]?.agents ?? {},
        ).filter((r) => r.enabled).length,
      }));
      res.json(pluginInfos);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // PATCH /plugin-routing/:pluginId/agents/:agentId — toggle agent in plugin
  app.patch("/plugin-routing/:pluginId/agents/:agentId", async (req, res) => {
    try {
      const { services } = createAgentsManager();
      const enabled = await services.routing.toggleAgentPlugin(
        req.params.pluginId,
        req.params.agentId,
      );
      const { registry } = createAgentsManager();
      await registry.exportAll();
      res.json({
        pluginId: req.params.pluginId,
        agentId: req.params.agentId,
        enabled,
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
```

- [x] **Step 3: Delete `item-routes.ts`**

Old `/agent-config/:key` CRUD is replaced by `/agent-catalog/:id`. Delete the file:

```bash
rm packages/server-core/src/routes/agent-config/item-routes.ts
```

- [x] **Step 4: Delete `global-fallback-routes.ts` and `sync-aliases-routes.ts`**

Global fallback is now part of `PluginRoutingConfig.globalFallbackModel`. Sync aliases is removed (no legacy support).

```bash
rm packages/server-core/src/routes/agent-config/global-fallback-routes.ts
rm packages/server-core/src/routes/agent-config/sync-aliases-routes.ts
```

- [x] **Step 5: Delete `agent-definitions-routes.ts`**

Old separate endpoint for definitions is replaced by `/agent-catalog`:

```bash
rm packages/server-core/src/routes/agent-definitions-routes.ts
```

- [x] **Step 6: Update `agent-config-routes.ts` (the barrel file)**

Replace old sub-registrations with new ones:

```typescript
import type { Application } from "express";
import type { RouteOptions } from "../types/index.js";
import { registerConfigRoutes } from "./agent-config/config-routes.js";
// Note: item-routes, global-fallback-routes, sync-aliases-routes are DELETED.

export function registerAgentConfigRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  registerConfigRoutes(app, opts);
}
```

- [x] **Step 7: Update main `routes/index.ts` to register plugin routing**

Find the route registration file and add the plugin routing routes. Check `packages/server-core/src/routes/index.ts`:

```bash
grep -n "register" packages/server-core/src/routes/index.ts
```

The file likely registers `registerAgentRoutingRoutes` — update to use `registerPluginRoutingRoutes`.

- [x] **Step 8: Commit**

```bash
git add .
git commit -m "refactor(server): migrate agent routes to SystemAgent catalog + plugin routing"
```

---

### Task 4: Rewrite API Client — new endpoints matching new server routes

**Files:**
- Modify: `apps/web/src/lib/api-client/agent-config.ts`
- Modify: `apps/web/src/lib/api-client/agent-routing.ts`
- Delete: `apps/web/src/lib/api-client/agent-definitions.ts`
- Modify: `apps/web/src/lib/api-client/plugin-routing.ts`
- Modify: `apps/web/src/lib/api-client.ts` (barrel)

- [x] **Step 1: Rewrite `agent-config.ts` → `agent-catalog.ts`**

Create new file `apps/web/src/lib/api-client/agent-catalog.ts`:

```typescript
import type {
  AgentCatalogResponse,
  AgentCatalogDetailResponse,
  SystemAgent,
} from "@lite-llm/api-contracts/agent-routing";
import { fetchApi } from "./core";

export async function getAgentCatalog(): Promise<AgentCatalogResponse> {
  return fetchApi("/agent-catalog");
}

export async function getSystemAgent(
  id: string,
): Promise<AgentCatalogDetailResponse> {
  return fetchApi(`/agent-catalog/${id}`);
}

export async function upsertSystemAgent(
  id: string,
  agent: SystemAgent,
): Promise<{ success: boolean }> {
  return fetchApi(`/agent-catalog/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(agent),
  });
}

export async function deleteSystemAgent(
  id: string,
): Promise<{ success: boolean }> {
  return fetchApi(`/agent-catalog/${id}`, {
    method: "DELETE",
  });
}
```

Delete old `agent-config.ts`:

```bash
rm apps/web/src/lib/api-client/agent-config.ts
```

- [x] **Step 2: Delete `agent-routing.ts` (old alias routing)**

```bash
rm apps/web/src/lib/api-client/agent-routing.ts
```

- [x] **Step 3: Delete `agent-definitions.ts`**

```bash
rm apps/web/src/lib/api-client/agent-definitions.ts
```

- [x] **Step 4: Rewrite `plugin-routing.ts`**

Replace old simple toggle with full plugin routing API:

```typescript
import type {
  PluginInfo,
  PluginRoutingResponse,
} from "@lite-llm/api-contracts/agent-catalog";
import { fetchApi } from "./core";

export async function getPluginRouting(): Promise<PluginRoutingResponse> {
  return fetchApi("/plugin-routing");
}

export async function getAvailablePlugins(): Promise<PluginInfo[]> {
  return fetchApi("/plugin-routing/plugins");
}

export async function toggleAgentPlugin(
  pluginId: string,
  agentId: string,
): Promise<{ pluginId: string; agentId: string; enabled: boolean }> {
  return fetchApi(`/plugin-routing/${pluginId}/agents/${agentId}`, {
    method: "PATCH",
  });
}
```

- [x] **Step 5: Update barrel `apps/web/src/lib/api-client.ts`**

Replace old exports:

```typescript
export * from "./api-client/analytics";
export * from "./api-client/agent-catalog";
export * from "./api-client/core";
export * from "./api-client/credentials";
export * from "./api-client/health-check";
export * from "./api-client/models";
export * from "./api-client/monitor";
export * from "./api-client/plugin-routing";
export * from "./api-client/spend";
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(web): rewrite API client for SystemAgent catalog + plugin routing"
```

---

### Task 5: Rewrite Query Keys

**Files:**
- Modify: `apps/web/src/lib/query-keys.ts`

Remove old keys (`agentRoutingData`, `agentRoutingAliases`, `agentDefinitions`, `syncAliases`). Replace with new keys:

- [x] **Step 1: Replace old query keys**

In `apps/web/src/lib/query-keys.ts`, remove these lines:
```
agentRoutingData: ["agent-routing-data"] as const,
agentRoutingAliases: ["agent-routing-aliases"] as const,
agentDefinitions: ["agent-definitions"] as const,
syncAliases: ["sync-aliases"] as const,
```

Replace `agentCatalog` keys to match new structure:

```typescript
agentCatalog: {
  all: ["agent-catalog"] as const,
  detail: (id: string) => ["agent-catalog", id] as const,
} as const,
```

These keys already exist in the file (lines 87-90 in current version) — confirm they remain. Remove old keys only.

- [x] **Step 2: Commit**

```bash
git add apps/web/src/lib/query-keys.ts
git commit -m "refactor(web): update query keys for new agent catalog API"
```

---

### Task 6: Rewrite page hooks — use SystemAgent instead of AgentConfig

**Files:**
- Rewrite: `apps/web/src/pages/agents/use-agent-routing-state.ts`
- Rewrite: `apps/web/src/pages/agents/use-agent-routing-actions.ts`
- Rewrite: `apps/web/src/pages/agents/use-agent-routing-derived.ts`
- Rewrite: `apps/web/src/pages/agents/use-agent-routing-page.ts`
- Delete: `apps/web/src/pages/agents/use-agent-routing-alias-actions.ts`
- Delete: `apps/web/src/pages/agents/use-agent-routing-dialog-state.ts` (if it exists)

The old hooks use `AgentConfig`/`CategoryConfig` flat types, `AGENT_DEFINITIONS` hardcoded fallbacks, and `syncAliases`/`globalFallbackModel` standalone state. All of this goes away.

- [x] **Step 1: Rewrite `use-agent-routing-state.ts`**

```typescript
import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { useQuery } from "@tanstack/react-query";
import { getAgentCatalog } from "../../lib/api-client/agent-catalog";
import { queryKeys } from "../../lib/query-keys";

export function useAgentRoutingState() {
  const catalogQuery = useQuery({
    queryKey: queryKeys.agentCatalog.all,
    queryFn: getAgentCatalog,
  });

  const agents: SystemAgent[] = catalogQuery.data?.agents ?? [];

  return {
    agents,
    loading: catalogQuery.isPending && !catalogQuery.data,
    error:
      catalogQuery.error instanceof Error
        ? catalogQuery.error.message
        : null,
  };
}
```

- [x] **Step 2: Rewrite `use-agent-routing-actions.ts`**

```typescript
import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  deleteSystemAgent,
  upsertSystemAgent,
} from "../../lib/api-client/agent-catalog";
import { queryKeys } from "../../lib/query-keys";

export function useAgentRoutingActions() {
  const queryClient = useQueryClient();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string>("");

  const upsertMutation = useMutation({
    mutationFn: ({ id, agent }: { id: string; agent: SystemAgent }) =>
      upsertSystemAgent(id, agent),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSystemAgent(id),
  });

  const saving = upsertMutation.isPending || deleteMutation.isPending;

  const handleSaveAgent = useCallback(
    async (agent: SystemAgent) => {
      await upsertMutation.mutateAsync({
        id: agent.id,
        agent,
      });
      setDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentCatalog.all,
      });
    },
    [queryClient, upsertMutation],
  );

  const handleDeleteAgent = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.agentCatalog.all,
      });
    },
    [deleteMutation, queryClient],
  );

  const openAgentEditor = useCallback((id: string) => {
    setEditingAgentId(id);
    setDialogOpen(true);
  }, []);

  return {
    saving,
    dialogOpen,
    editingAgentId,
    setDialogOpen,
    handleSaveAgent,
    handleDeleteAgent,
    openAgentEditor,
  };
}
```

- [x] **Step 3: Rewrite `use-agent-routing-derived.ts`**

```typescript
import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { useCallback, useMemo } from "react";

export interface AgentSummaryInfo {
  id: string;
  displayName: string;
  icon: string;
  description: string;
  model: string;
  versionCount: number;
  pluginCount: number;
  mode: string;
}

export function useAgentRoutingDerived(
  agents: SystemAgent[],
) {
  const agentsList = useMemo(() => agents, [agents]);

  const getAgentSummary = useCallback(
    (id: string): AgentSummaryInfo | null => {
      const agent = agentsList.find((a) => a.id === id);
      if (!agent) return null;

      return {
        id: agent.id,
        displayName: agent.displayName,
        icon: agent.icon,
        description: agent.description,
        model: agent.model || "Unassigned",
        versionCount: agent.versions.length,
        pluginCount: agent.enabledPlugins.length,
        mode: agent.config.mode ?? "subagent",
      };
    },
    [agentsList],
  );

  return { agentsList, getAgentSummary };
}
```

- [x] **Step 4: Rewrite `use-agent-routing-page.ts`**

```typescript
import { useAgentRoutingActions } from "./use-agent-routing-actions";
import { useAgentRoutingDerived } from "./use-agent-routing-derived";
import { useAgentRoutingState } from "./use-agent-routing-state";

export function useAgentRoutingPageState() {
  const { agents, loading, error } = useAgentRoutingState();

  const {
    saving,
    dialogOpen,
    editingAgentId,
    setDialogOpen,
    handleSaveAgent,
    handleDeleteAgent,
    openAgentEditor,
  } = useAgentRoutingActions();

  const { getAgentSummary } = useAgentRoutingDerived(agents);

  return {
    loading,
    saving,
    error,
    agents,
    dialogOpen,
    editingAgentId,
    setDialogOpen,
    handleSaveAgent,
    handleDeleteAgent,
    openAgentEditor,
    getAgentSummary,
  };
}
```

- [x] **Step 5: Delete `use-agent-routing-alias-actions.ts`**

```bash
rm apps/web/src/pages/agents/use-agent-routing-alias-actions.ts
```

- [x] **Step 6: Check for and delete dialog-state file**

```bash
test -f apps/web/src/pages/agents/use-agent-routing-dialog-state.ts && rm apps/web/src/pages/agents/use-agent-routing-dialog-state.ts || true
```

- [x] **Step 7: Commit**

```bash
git add .
git commit -m "refactor(web): rewrite agent page hooks for SystemAgent"
```

---

### Task 7: Rewrite component types — remove old ConfigInfo, AgentDefinition, CategoryDefinition

**Files:**
- Modify: `apps/web/src/components/agent-routing/agent-routing-types.ts`
- Modify: `apps/web/src/components/plugin-routing/plugin-routing-types.ts`

- [x] **Step 1: Rewrite `agent-routing-types.ts`**

Replace old `ConfigInfo`:

```typescript
import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";

export type AgentFocusViewProps = {
  loading: boolean;
  agents: SystemAgent[];
  onOpenAgentConfig: (id: string) => void;
  onDeleteAgent: (id: string) => void;
};

export type AgentTabProps = {
  loading: boolean;
  agents: SystemAgent[];
  onOpenAgentConfig: (id: string) => void;
  onDeleteAgent: (id: string) => void;
};
```

- [x] **Step 2: Rewrite `plugin-routing-types.ts`**

Keep mostly the same but update imports:

```typescript
import type { PluginInfo } from "@lite-llm/api-contracts/agent-catalog";

export type PluginCardProps = {
  plugin: PluginInfo;
  onToggle: (pluginId: string) => void;
  onToggleAgent: (pluginId: string, agentId: string) => void;
  agentNames?: string[];
  enabledAgentIds?: string[];
};

export type PluginRoutingGridProps = {
  plugins: PluginInfo[];
  loading: boolean;
  onTogglePlugin: (pluginId: string) => void;
  onToggleAgent: (pluginId: string, agentId: string) => void;
  agentNames?: string[];
  enabledAgentIds?: string[];
};
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "refactor(web): update component types for SystemAgent"
```

---

### Task 8: Rewrite agent-routing components — use SystemAgent instead of AgentDefinition

**Files:**
- Rewrite: `apps/web/src/components/agent-routing/entity-focus-card.tsx`
- Rewrite: `apps/web/src/components/agent-routing/entity-routing-card.tsx`
- Rewrite: `apps/web/src/components/agent-routing/agent-focus-view.tsx`
- Rewrite: `apps/web/src/components/agent-routing/agent-routing-agents-tab.tsx`
- Delete: `apps/web/src/components/agent-routing/category-focus-view.tsx`
- Delete: `apps/web/src/components/agent-routing/agent-routing-categories-tab.tsx`
- Delete: `apps/web/src/components/agent-routing/agent-routing-aliases-tab.tsx`
- Delete: `apps/web/src/components/agent-routing/agent-routing-alias-dialog.tsx`
- Delete: `apps/web/src/components/agent-routing/agent-routing-aliases/` (entire subdirectory)

Categories are now also `SystemAgent` instances — no separate category tab. Aliases tab is removed entirely.

- [ ] **Step 1: Rewrite `entity-focus-card.tsx`**

```tsx
import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type EntityFocusCardProps = {
  agent: SystemAgent;
  onOpenConfig: (id: string) => void;
  onDelete: (id: string) => void;
};

export function EntityFocusCard({
  agent,
  onOpenConfig,
  onDelete,
}: EntityFocusCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{agent.icon}</span>
            <div>
              <CardTitle className="text-sm">{agent.displayName}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">
                {agent.id}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onOpenConfig(agent.id)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => onDelete(agent.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {agent.description}
        </p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {agent.versions.length} version{agent.versions.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {agent.enabledPlugins.length} plugin{agent.enabledPlugins.length !== 1 ? "s" : ""}
          </Badge>
          {agent.config.mode && (
            <Badge variant="secondary" className="text-xs">
              {agent.config.mode}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Rewrite `entity-routing-card.tsx`**

```tsx
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type EntityRoutingCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  totalCount: number;
  configuredCount: number;
  children: ReactNode;
};

export function EntityRoutingCard({
  icon: Icon,
  title,
  totalCount,
  configuredCount,
  children,
}: EntityRoutingCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="text-sm text-muted-foreground">
            ({configuredCount}/{totalCount})
          </span>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Rewrite `agent-focus-view.tsx`**

```tsx
import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { EntityFocusCard } from "./entity-focus-card";

type AgentFocusViewProps = {
  loading: boolean;
  agents: SystemAgent[];
  onOpenAgentConfig: (id: string) => void;
  onDeleteAgent: (id: string) => void;
};

export function AgentFocusView({
  loading,
  agents,
  onOpenAgentConfig,
  onDeleteAgent,
}: AgentFocusViewProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {agents.map((agent) => (
        <EntityFocusCard
          key={agent.id}
          agent={agent}
          onOpenConfig={onOpenAgentConfig}
          onDelete={onDeleteAgent}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `agent-routing-agents-tab.tsx`**

```tsx
import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { Zap } from "lucide-react";
import { AgentFocusView } from "./agent-focus-view";
import { EntityRoutingCard } from "./entity-routing-card";

type AgentRoutingAgentsTabProps = {
  loading: boolean;
  agents: SystemAgent[];
  onOpenAgentConfig: (id: string) => void;
  onDeleteAgent: (id: string) => void;
};

export function AgentRoutingAgentsTab({
  loading,
  agents,
  onOpenAgentConfig,
  onDeleteAgent,
}: AgentRoutingAgentsTabProps) {
  const configuredCount = agents.filter(
    (a) => a.model !== "" && a.versions.length > 0,
  ).length;

  return (
    <EntityRoutingCard
      icon={Zap}
      title="Agents"
      totalCount={agents.length}
      configuredCount={configuredCount}
    >
      <AgentFocusView
        loading={loading}
        agents={agents}
        onOpenAgentConfig={onOpenAgentConfig}
        onDeleteAgent={onDeleteAgent}
      />
    </EntityRoutingCard>
  );
}
```

- [ ] **Step 5: Delete old category/alias components**

```bash
rm apps/web/src/components/agent-routing/category-focus-view.tsx
rm apps/web/src/components/agent-routing/agent-routing-categories-tab.tsx
rm apps/web/src/components/agent-routing/agent-routing-aliases-tab.tsx
rm apps/web/src/components/agent-routing/agent-routing-alias-dialog.tsx
rm -rf apps/web/src/components/agent-routing/agent-routing-aliases/
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "refactor(web): rewrite agent-routing components for SystemAgent"
```

---

### Task 9: Rewrite agent config editor — edit SystemAgent instead of AgentConfig

**Files:**
- Rewrite: `apps/web/src/components/agent-config-editor.tsx`
- Rewrite: `apps/web/src/components/agent-config-editor/normalize.ts`
- Rewrite: `apps/web/src/components/agent-config-editor/model-section.tsx`
- Delete: `apps/web/src/components/category-config-editor/` (entire directory)
- Delete: `apps/web/src/components/model-fallback-selector.tsx`
- Delete: `apps/web/src/components/model-fallback-selector/` (entire directory)
- Delete: `apps/web/src/components/global-fallback-selector.tsx`

The old editor edited flat `AgentConfig` with `model`, `fallback_models`, `tools`, etc. The new editor edits a `SystemAgent` with versions, plugins, and config.

- [ ] **Step 1: Rewrite `agent-config-editor/normalize.ts`**

```typescript
import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";

export function normalizeSystemAgent(
  partial: Partial<SystemAgent> & { id: string },
): SystemAgent {
  return {
    id: partial.id,
    displayName: partial.displayName ?? partial.id,
    icon: partial.icon ?? "🔧",
    description: partial.description ?? "",
    versions: partial.versions ?? [],
    model: partial.model ?? "",
    fallbackModels: partial.fallbackModels ?? [],
    enabledPlugins: partial.enabledPlugins ?? [],
    config: {
      mode: partial.config?.mode ?? "subagent",
      tools: partial.config?.tools ?? {},
      permissions: partial.config?.permissions ?? {},
      color: partial.config?.color ?? "#555555",
      disable: partial.config?.disable ?? false,
      variant: partial.config?.variant,
      category: partial.config?.category,
      skills: partial.config?.skills ?? [],
      temperature: partial.config?.temperature,
      topP: partial.config?.topP,
      prompt: partial.config?.prompt,
      promptAppend: partial.config?.promptAppend,
    },
  };
}
```

- [ ] **Step 2: Rewrite `agent-config-editor.tsx`**

```tsx
import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { normalizeSystemAgent } from "./agent-config-editor/normalize";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface AgentConfigEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: SystemAgent | null;
  onSave: (agent: SystemAgent) => Promise<void>;
  saving?: boolean;
}

export function AgentConfigEditor({
  open,
  onOpenChange,
  agent,
  onSave,
  saving = false,
}: AgentConfigEditorProps) {
  const [config, setConfig] = useState<SystemAgent>(() =>
    normalizeSystemAgent(agent ?? { id: "" }),
  );

  useEffect(() => {
    if (agent) {
      setConfig(normalizeSystemAgent(agent));
    }
  }, [agent]);

  const updateField = <K extends keyof SystemAgent>(
    field: K,
    value: SystemAgent[K],
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const updateConfigField = <K extends keyof SystemAgent["config"]>(
    field: K,
    value: SystemAgent["config"][K],
  ) => {
    setConfig((prev) => ({
      ...prev,
      config: { ...prev.config, [field]: value },
    }));
  };

  const handleSave = async () => {
    await onSave(config);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Agent: {config.displayName || config.id}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit configuration for {config.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent-id">ID</Label>
              <Input id="agent-id" value={config.id} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-name">Display Name</Label>
              <Input
                id="agent-name"
                value={config.displayName}
                onChange={(e) => updateField("displayName", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-desc">Description</Label>
            <Textarea
              id="agent-desc"
              value={config.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent-icon">Icon</Label>
              <Input
                id="agent-icon"
                value={config.icon}
                onChange={(e) => updateField("icon", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-color">Color</Label>
              <Input
                id="agent-color"
                type="color"
                value={config.config.color ?? "#555555"}
                onChange={(e) => updateConfigField("color", e.target.value)}
                className="h-9 w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-mode">Mode</Label>
            <select
              id="agent-mode"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={config.config.mode ?? "subagent"}
              onChange={(e) =>
                updateConfigField(
                  "mode",
                  e.target.value as "subagent" | "primary" | "all",
                )
              }
            >
              <option value="subagent">Subagent</option>
              <option value="primary">Primary</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin me-2" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Delete model-section.tsx (old approach)**

The `model-section.tsx` imported `ModelFallbackSelector` which is being deleted. Remove it:

```bash
rm apps/web/src/components/agent-config-editor/model-section.tsx
```

- [ ] **Step 4: Delete category config editor, model fallback selector, and global fallback selector**

```bash
rm -rf apps/web/src/components/category-config-editor/
rm apps/web/src/components/model-fallback-selector.tsx
rm -rf apps/web/src/components/model-fallback-selector/
rm apps/web/src/components/global-fallback-selector.tsx
```

- [ ] **Step 5: Clean up unused agent-config-editor subfiles**

Check which subfiles are still imported by the new editor and delete unused ones:
- `agent-config-editor-execution-section.tsx`, `agent-config-editor-permissions-section.tsx`, `agent-config-editor-primary-sections.tsx`, `basic-section.tsx`, `prompts-section.tsx`, `skill-utils.ts`, `tool-utils.ts` — these are all used by the old editor. The new simplified editor doesn't use them.

```bash
rm apps/web/src/components/agent-config-editor/agent-config-editor-execution-section.tsx
rm apps/web/src/components/agent-config-editor/agent-config-editor-permissions-section.tsx
rm apps/web/src/components/agent-config-editor/agent-config-editor-primary-sections.tsx
rm apps/web/src/components/agent-config-editor/basic-section.tsx
rm apps/web/src/components/agent-config-editor/prompts-section.tsx
rm apps/web/src/components/agent-config-editor/skill-utils.ts
rm apps/web/src/components/agent-config-editor/tool-utils.ts
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "refactor(web): rewrite config editor for SystemAgent, remove legacy editors"
```

---

### Task 10: Rewrite the agents page

**Files:**
- Rewrite: `apps/web/src/pages/agents.tsx`
- Delete: `apps/web/src/pages/agents/` (entire subdirectory for old hooks, keep new hooks)

Wait — the hooks were rewritten in Task 6 and live in `pages/agents/`. The page file is `pages/agents.tsx`.

- [x] **Step 1: Rewrite `apps/web/src/pages/agents.tsx`**

```tsx
"use client";

import { Settings, Trash2 } from "lucide-react";
import { AgentConfigEditor } from "../components/agent-config-editor";
import { AgentRoutingAgentsTab } from "../components/agent-routing/agent-routing-agents-tab";
import { Button } from "../components/ui/button";
import { PageLayout } from "../components/ui/page-layout";
import { useAgentRoutingPageState } from "./agents/use-agent-routing-page";

export function AgentsPage() {
  const {
    agents,
    loading,
    saving,
    error,
    dialogOpen,
    editingAgentId,
    setDialogOpen,
    handleSaveAgent,
    handleDeleteAgent,
    openAgentEditor,
  } = useAgentRoutingPageState();

  const editingAgent = agents.find((a) => a.id === editingAgentId) ?? null;

  return (
    <PageLayout
      title="Agents"
      subtitle="Manage system agents and their configurations"
      icon={Settings}
    >
      <AgentRoutingAgentsTab
        loading={loading}
        agents={agents}
        onOpenAgentConfig={openAgentEditor}
        onDeleteAgent={handleDeleteAgent}
      />

      <AgentConfigEditor
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agent={editingAgent}
        onSave={handleSaveAgent}
        saving={saving}
      />
    </PageLayout>
  );
}
```

- [x] **Step 2: Remove unused imports from the page directory**

The old page directory had hooks that imported old types. After Task 6 rewrites, check for any stale files:

```bash
ls apps/web/src/pages/agents/
```

Only these should exist:
- `use-agent-routing-state.ts`
- `use-agent-routing-actions.ts`
- `use-agent-routing-derived.ts`
- `use-agent-routing-page.ts`

Delete anything else.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "refactor(web): rewrite agents page for SystemAgent catalog"
```

---

### Task 11: Update plugin-routing components and hooks

**Files:**
- Modify: `apps/web/src/hooks/use-plugin-routing.ts`
- Modify: `apps/web/src/components/plugin-routing/plugin-card.tsx`

The plugin routing already uses `PluginInfoDTO` from the catalog API. After Task 2, this type is `PluginInfo`. Update imports.

- [x] **Step 1: Update `use-plugin-routing.ts` imports**

The hook already works with the new API — just verify imports are correct:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAvailablePlugins,
  toggleAgentPlugin,
} from "@/lib/api-client/plugin-routing";
import { queryKeys } from "@/lib/query-keys";

export function useToggleAgentPlugin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pluginId,
      agentId,
    }: {
      pluginId: string;
      agentId: string;
    }) => toggleAgentPlugin(pluginId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pluginRouting.all,
      });
    },
  });
}

export function useAvailablePlugins() {
  return useQuery({
    queryKey: queryKeys.pluginRouting.plugins,
    queryFn: getAvailablePlugins,
  });
}
```

No changes needed — the hook already works with `getAvailablePlugins` and `toggleAgentPlugin` from Task 4.

- [x] **Step 2: Verify and fix TypeScript compilation**

```bash
pnpm --filter @lite-llm/web typecheck
```

Expected: FAIL initially due to remaining stale imports. Fix each error by removing old import references:
- Any file importing `AgentConfig` from `@litellm/shared` → should import `SystemAgent`
- Any file importing `CategoryConfig` → remove (not needed)
- Any file importing `AgentDefinition`, `CategoryDefinition`, `AGENT_DEFINITIONS`, `CATEGORY_DEFINITIONS`, `AgentDefinitionsResponse` → remove
- Any file importing `AgentRoutingConfig` (old Record<string,string>) → remove or use `PluginRoutingConfig`
- Any file importing `getAgentConfig`, `updateAgentConfig`, `deleteAgentConfig`, `saveAllAgentConfigs`, `getGlobalFallbackModel`, `updateGlobalFallbackModel`, `getSyncAliasesConfig`, `setSyncAliasesConfig` → replace with `getAgentCatalog`, `upsertSystemAgent`, `deleteSystemAgent`
- Any file importing `getAgentRoutingConfig`, `updateAgentRoutingConfig` → remove or replace with plugin routing
- Any file importing `getAgentDefinitions` → remove

Run `pnpm typecheck` after each fix until green.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "fix(web): resolve all TypeScript errors from migration"
```

---

### Task 12: Run full test suite and CI checks

**Files:**
- Remove stale test files that test old functionality

- [x] **Step 1: Check for stale tests**

```bash
grep -rl "AgentConfig\|CategoryConfig\|AgentDefinition\|AGENT_DEFINITIONS\|agent-config\|agent-routing\|agent-definitions" apps/ packages/ --include="*.test.*" --include="*.spec.*" --include="*__tests__*"
```

Delete or update any tests that reference old types.

- [x] **Step 2: Run typecheck across all packages**

```bash
pnpm typecheck
```

Expected: PASS

- [x] **Step 3: Run lint**

```bash
pnpm lint
```

Expected: PASS (fix any issues)

- [x] **Step 4: Run tests**

```bash
pnpm test
```

Expected: PASS (some tests may need updates — fix them)

- [x] **Step 5: Commit final fixes**

```bash
git add .
git commit -m "fix: resolve remaining test and lint issues from migration"
```

---

### Task 13: Verify data flow — end-to-end test with the server

- [x] **Step 1: Start the server**

```bash
pnpm dev
```

- [x] **Step 2: Test `GET /agent-catalog`**

```bash
curl -s http://localhost:3008/api/agent-catalog | head -c 200
```

Expected: JSON with `{ agents: [...] }` containing `SystemAgent` objects.

- [x] **Step 3: Test `PUT /agent-catalog/test-agent`**

```bash
curl -s -X PUT http://localhost:3008/api/agent-catalog/test-agent \
  -H "Content-Type: application/json" \
  -d '{"id":"test-agent","displayName":"Test","icon":"🧪","description":"test","versions":[],"model":"","fallbackModels":[],"enabledPlugins":[],"config":{"mode":"subagent"}}'
```

Expected: `{ success: true }`

- [x] **Step 4: Test `GET /plugin-routing`**

```bash
curl -s http://localhost:3008/api/plugin-routing | head -c 200
```

Expected: JSON with `{ config: {...}, plugins: [...] }`

- [x] **Step 5: Open the UI in the browser and verify the Agents page renders correctly**

The page at `http://localhost:5178/agents` should show agent cards with icon, name, version count, and plugin count. Clicking edit should open the simplified editor dialog.

- [x] **Step 6: Commit any fixes from E2E testing**

```bash
git add .
git commit -m "fix: end-to-end fixes from migration verification"
```

---

## Summary of Deletions

| Old File | Reason |
|----------|--------|
| `packages/shared/src/types/agent-config.ts` (old content) | Flat types replaced with SystemAgent re-exports |
| `packages/api-contracts/src/agent-routing.ts` (old content) | Hardcoded arrays + old types removed |
| `packages/server-core/src/routes/agent-config/item-routes.ts` | Replaced by /agent-catalog/:id |
| `packages/server-core/src/routes/agent-config/global-fallback-routes.ts` | Global fallback in routing config |
| `packages/server-core/src/routes/agent-config/sync-aliases-routes.ts` | No legacy sync aliases |
| `packages/server-core/src/routes/agent-definitions-routes.ts` | Replaced by /agent-catalog |
| `apps/web/src/lib/api-client/agent-config.ts` | Replaced by agent-catalog.ts |
| `apps/web/src/lib/api-client/agent-routing.ts` | Old alias routing removed |
| `apps/web/src/lib/api-client/agent-definitions.ts` | Replaced by /agent-catalog |
| `apps/web/src/pages/agents/use-agent-routing-alias-actions.ts` | Alias management removed |
| `apps/web/src/pages/agents/use-agent-routing-dialog-state.ts` | Dialog state folded into actions |
| `apps/web/src/components/agent-routing/category-focus-view.tsx` | Categories are SystemAgents now |
| `apps/web/src/components/agent-routing/agent-routing-categories-tab.tsx` | Categories merged into agents tab |
| `apps/web/src/components/agent-routing/agent-routing-aliases-tab.tsx` | Alias tab removed |
| `apps/web/src/components/agent-routing/agent-routing-alias-dialog.tsx` | Alias dialog removed |
| `apps/web/src/components/agent-routing/agent-routing-aliases/` | Alias subdirectory removed |
| `apps/web/src/components/category-config-editor/` | Categories use same editor as agents |
| `apps/web/src/components/model-fallback-selector.tsx` | Fallback selecting removed from UI |
| `apps/web/src/components/model-fallback-selector/` | Fallback subdirectory removed |
| `apps/web/src/components/global-fallback-selector.tsx` | Global fallback in routing config |
| `apps/web/src/components/agent-config-editor/model-section.tsx` | Old model section deleted |
| `apps/web/src/components/agent-config-editor/*` (7 files) | Old editor sub-sections deleted |
