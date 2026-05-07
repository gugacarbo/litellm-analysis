# @lite-llm/agents-manager — Sistema de Tipos

## Visão Geral

O pacote utiliza dois sistemas de tipos paralelos:
1. **Formato Interno/DB** (camelCase) — armazenado em `db.json`
2. **Formato Externo/API** (snake_case) — usado em APIs públicas e arquivos de output

## Tipos Internos (types/db.ts)

### `DbConfig`

Objeto de configuração raiz armazenado em `db.json`.

```typescript
interface DbConfig {
  $schema?: string;
  version: number;
  litellm: {
    baseUrl: string;
    apiKey: string;
  };
  models: Record<string, DbModelSpec>;
  agents: Record<string, DbAgentEntry>;
  categories: Record<string, DbCategoryEntry>;
  globalFallbackModel?: string;
  customAliases?: Record<string, string>;
}
```

### `DbAgentEntry`

Configuração de agente no formato interno.

```typescript
interface DbAgentEntry {
  model: string;
  fallbackModels?: string[];
  description?: string;
  color?: string;
  disable?: boolean;
  variant?: string;
  category?: string;
  skills?: string[];
  temperature?: number;
  top_p?: number;
  prompt?: string;
  prompt_append?: string;
  tools?: Record<string, boolean>;
  mode?: "subagent" | "primary" | "all";
  permission?: {
    edit?: "ask" | "allow" | "deny";
    bash?: "ask" | "allow" | "deny" | Record<string, "ask" | "allow" | "deny">;
    webfetch?: "ask" | "allow" | "deny";
    doom_loop?: "ask" | "allow" | "deny";
    external_directory?: "ask" | "allow" | "deny";
  };
}
```

### `DbCategoryEntry`

Configuração de categoria no formato interno.

```typescript
interface DbCategoryEntry {
  model: string;
  fallbackModels?: string[];
  description?: string;
  variant?: string;
  temperature?: number;
  top_p?: number;
  maxTokens?: number;
  thinking?: {
    type: "enabled" | "disabled";
    budgetTokens?: number;
  };
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
  textVerbosity?: "low" | "medium" | "high";
  tools?: Record<string, boolean>;
  prompt_append?: string;
  is_unstable_agent?: boolean;
}
```

### `DbModelSpec`

Especificação de modelo para LiteLLM.

```typescript
interface DbModelSpec {
  displayName: string;
  ownedBy?: string;
  family?: string;
  contextLength: number;
  maxOutput: number;
  cost?: {
    input?: number;
    output?: number;
  };
}
```

---

## Tipos Externos (types/config.ts)

### `AgentConfig`

Configuração de agente no formato API/externo (snake_case).

```typescript
interface AgentConfig {
  model?: string;
  fallback_models?: string[];
  description?: string;
  color?: string;
  disable?: boolean;
  variant?: string;
  category?: string;
  skills?: string[];
  temperature?: number;
  top_p?: number;
  prompt?: string;
  prompt_append?: string;
  tools?: Record<string, boolean>;
  mode?: "subagent" | "primary" | "all";
  permission?: {
    edit?: "ask" | "allow" | "deny";
    bash?: "ask" | "allow" | "deny" | Record<string, "ask" | "allow" | "deny">;
    webfetch?: "ask" | "allow" | "deny";
    doom_loop?: "ask" | "allow" | "deny";
    external_directory?: "ask" | "allow" | "deny";
  };
  [key: string]: unknown;  // Permite propriedades adicionais
}
```

### `CategoryConfig`

Configuração de categoria no formato API/externo (snake_case).

```typescript
interface CategoryConfig {
  model?: string;
  fallback_models?: string[];
  description?: string;
  variant?: string;
  temperature?: number;
  top_p?: number;
  maxTokens?: number;
  thinking?: {
    type: "enabled" | "disabled";
    budgetTokens?: number;
  };
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
  textVerbosity?: "low" | "medium" | "high";
  tools?: Record<string, boolean>;
  prompt_append?: string;
  is_unstable_agent?: boolean;
  [key: string]: unknown;  // Permite propriedades adicionais
}
```

### `AgentConfigFile`

Estrutura completa do arquivo de configuração.

```typescript
interface AgentConfigFile {
  agents?: Record<string, AgentConfig>;
  categories?: Record<string, CategoryConfig>;
  globalFallbackModel?: string;
}
```

---

## Tipos de Caminhos (types/paths.ts)

### `FilePaths`

Caminhos de arquivos resolvidos para todos os arquivos de configuração e output.

```typescript
interface FilePaths {
  projectRoot: string;
  configDir: string;
  dataDir: string;
  dbFile: string;
  legacyConfigFile: string;
  providersFile: string;
  vscodeModelsFile: string;
  outputConfigFile: string;
}
```

### `DEFAULT_FILE_PATHS`

Configuração de caminhos padrão (relativos à raiz do projeto).

---

## Matriz de Conversão

| Propriedade | Interno (DB) | Externo (API) |
|-------------|--------------|---------------|
| Modelos fallback | `fallbackModels` | `fallback_models` |
| Max tokens | `maxTokens` | `maxTokens` |
| Reasoning effort | `reasoningEffort` | `reasoningEffort` |
| Text verbosity | `textVerbosity` | `textVerbosity` |
| Prompt append | `prompt_append` | `prompt_append` |
| Unstable agent | `is_unstable_agent` | `is_unstable_agent` |

**Nota:** A maioria das propriedades compartilha nomenclatura camelCase em ambos os formatos. Apenas `fallbackModels` / `fallback_models` difere.

---

## Interface do Adapter

### `IAgentAdapter`

```typescript
interface IAgentAdapter {
  toApi(db: DbAgentEntry): AgentConfig;
  toDb(api: Partial<AgentConfig>): Partial<DbAgentEntry>;
}
```

### `ICategoryAdapter`

```typescript
interface ICategoryAdapter {
  toApi(db: DbCategoryEntry): CategoryConfig;
  toDb(api: Partial<CategoryConfig>): Partial<DbCategoryEntry>;
}
```

---

## Interface do Transformer

### `IAgentTransformer`

```typescript
interface IAgentTransformer {
  toOutput(
    agents: Record<string, DbAgentEntry>,
    globalFallbackModel?: string,
  ): Record<string, AgentConfig>;
}
```

### `ICategoryTransformer`

```typescript
interface ICategoryTransformer {
  toOutput(
    categories: Record<string, DbCategoryEntry>,
    globalFallbackModel?: string,
  ): Record<string, CategoryConfig>;
}
```

---

## Interfaces dos Geradores

### `IProvidersGenerator`

```typescript
interface IProvidersGenerator {
  write(config?: unknown, dbModels?: DbModelWithParams[]): Promise<void>;
}
```

### `IVscodeModelsGenerator`

```typescript
interface IVscodeModelsGenerator {
  write(dbModels?: DbModelWithParams[]): Promise<void>;
}
```

---

## Interface de Storage

### `IFileStorage`

```typescript
interface IFileStorage {
  read(): Promise<DbConfig>;
  write(config: DbConfig): Promise<void>;
  getPaths(): FilePaths;
}
```
