# Alternar Sincronização de Aliases — Documento de Design

**Data:** 2026-05-08
**Status:** Aprovado

## Contexto

A página de roteamento de agentes possui um parâmetro `syncAliases` no backend (`PUT /agent-config/:key`)
que controla se alterações em agentes/categorias disparam a regeneração de aliases via `alias-router`.
Atualmente a UI define `true` fixo, sempre sincronizando aliases quando um agente é atualizado.

Usuários que gerenciam aliases do LiteLLM manualmente fora da UI (ou via outras ferramentas) precisam de
uma forma de desabilitar essa sincronização automática.

## Requisitos

- Um interruptor (toggle switch) no cabeçalho da página de roteamento de agentes para controlar a sincronização de aliases
- Padrão: desabilitado (`syncAliases: false`)
- Configuração persistida em `@storage/agents.json` (server-side)
- Configuração armazenada em `routing.syncAliases` no arquivo JSON

## Modelo de Dados

```json
{
  "routing": {
    "version": 1,
    "plugins": { ... },
    "globalFallbackModel": "MiniMax-M2.7-highspeed",
    "syncAliases": false
  }
}
```

- Campo opcional → se ausente, assume `false`
- Segue o padrão existente do `globalFallbackModel` no `RoutingService`

## Arquitetura (Abordagem 3: Estado Local + Persistência via API)

### Alterações no Backend

1. **`RoutingService`** (`packages/agents-manager/src/services/routing.service.ts`)
   - Adicionar `getSyncAliases(): Promise<boolean>` — lê `routing.syncAliases`
   - Adicionar `setSyncAliases(enabled: boolean): Promise<void>` — persiste o valor

2. **`agent-config-routes.ts`** (`packages/server-core/src/routes/`)
   - Adicionar `GET /agent-config/sync-aliases` → retorna `{ enabled: boolean }`
   - Adicionar `PUT /agent-config/sync-aliases` → aceita `{ enabled: boolean }`, persiste

3. **Config routes** (`packages/server-core/src/routes/agent-config/config-routes.ts`)
   - `PUT /agent-config` (Save All) — ler `routing.syncAliases` do `RoutingService` antes de chamar `regenerateAllAliases()`
   - Condicionar a regeneração de aliases: executar apenas quando `syncAliases` for `true`

4. **Item routes** (`packages/server-core/src/routes/agent-config/item-routes.ts`)
   - `PUT /agent-config/:key` — já possui `syncAliases` no body — sem alteração necessária
   - `DELETE /agent-config/:key` — ler `routing.syncAliases` do `RoutingService` antes de remover aliases
   - Chamar `updateAgentRoutingConfig` com deleções apenas quando `syncAliases` for `true`

### Alterações no Frontend

1. **Query keys** (`apps/web/src/lib/query-keys.ts`)
   - Adicionar `syncAliases: ["sync-aliases"]` ao mapa de chaves de query

2. **API client** (`apps/web/src/lib/api-client/agent-config.ts`)
   - Adicionar `getSyncAliasesConfig(): Promise<{ enabled: boolean }>`
   - Adicionar `setSyncAliasesConfig(enabled: boolean): Promise<{ success: boolean }>`
   - Re-exportado automaticamente via `apps/web/src/lib/api-client.ts`

3. **State hook** (`apps/web/src/pages/agent-routing/use-agent-routing-state.ts`)
   - Adicionar estado local `syncAliases` (`useState<boolean>(false)`)
   - Adicionar `useQuery` separada para `GET /agent-config/sync-aliases`
   - `useEffect` atualiza estado `syncAliases` a partir dos dados da query ao carregar
   - Retornar `syncAliases` e `setSyncAliases` do hook

4. **Actions hook** (`apps/web/src/pages/agent-routing/use-agent-routing-actions.ts`)
   - Aceitar `syncAliases: boolean` como novo parâmetro
   - Aceitar `setSyncAliases: (value: boolean) => void` para atualização otimista
   - Adicionar `handleToggleSyncAliases(enabled: boolean)` que faz atualização otimista + chama `setSyncAliasesConfig()` + invalida queries
   - Alterar `updateAgentConfigMutation` params para incluir `syncAliases: boolean`, passar para `updateAgentConfig()` em vez de `true` fixo
   - Retornar `handleToggleSyncAliases` do hook

5. **Page hook** (`apps/web/src/pages/agent-routing/use-agent-routing-page.ts`)
   - Passar `syncAliases` e `setSyncAliases` do state hook para o actions hook
   - Passar `handleToggleSyncAliases` adiante no retorno do page state

6. **Page component** (`apps/web/src/pages/agent-routing.tsx`)
   - Desestruturar `syncAliases` e `handleToggleSyncAliases` do page state
   - Adicionar componente Switch na área do cabeçalho, entre as abas e o seletor globalFallback
   - Switch: `checked={syncAliases}` `onCheckedChange={handleToggleSyncAliases}`
   - Label: "Sync Aliases" com tooltip

### Fluxo de Dados

```
Carregamento da Página
  → busca sync-aliases de GET /agent-config/sync-aliases
  → renderiza Switch na posição OFF se false

Usuário ativa o Switch
  → PUT /agent-config/sync-aliases { enabled: true }
  → estado local do React atualizado (otimista)
  → todas as chamadas subsequentes de updateAgentConfig usam syncAliases: true

Usuário atualiza um agente
  → updateAgentConfig(params.key, params.type, params.config, syncAliases)
  → backend respeita a flag
```

### Posicionamento na UI

```
┌─────────────────────────────────────────────────────┐
│  Agent Routing                                [Save All] │
├─────────────────────────────────────────────────────┤
│  [Agents] [Categories] [Model Stations]  [🔁 Sync Aliases] │
│                                             [globalFallback ▼] │
├─────────────────────────────────────────────────────┤
│                                                       │
```

O switch fica ao lado do seletor globalFallback na barra do cabeçalho,
entre as abas e os controles existentes.

### Componente

- Usar componente `Switch` do shadcn (já existe no projeto)
- Envolver com label + tooltip para clareza
- Texto do tooltip: "Quando desativado, alterações em agentes e categorias não geram mudanças nos aliases do LiteLLM"
- Texto alternativo mais curto: "Desativa sincronização automática de aliases"

## Testes

1. **Unitário: RoutingService** — testar `getSyncAliases()` retorna `false` quando campo ausente
2. **Unitário: RoutingService** — testar `setSyncAliases(true/false)` persiste corretamente
3. **Integração: agent-config routes** — testar endpoints GET/PUT sync-aliases
4. **Integração: item routes** — testar que `syncAliases: false` pula regeneração de aliases
5. **Integração: config routes** — testar que `syncAliases: false` no Save All pula regeneração
6. **Frontend: agent-routing page** — testar que switch renderiza, toggle chama API correta
7. **Frontend: agent-routing actions** — testar que `updateAgentConfig` recebe o valor atual de syncAliases
