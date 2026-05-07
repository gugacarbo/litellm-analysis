# @lite-llm/agents-manager — API Pública

## Módulo: `@lite-llm/agents-manager`

## Inicialização do Gerenciador

### `createAgentsManager(opcoes?)`

Inicializa o gerenciador singleton com caminhos de arquivos personalizados.

```typescript
import { createAgentsManager } from "@lite-llm/agents-manager";

createAgentsManager({
  projectRoot: process.cwd(),      // Diretório raiz para caminhos relativos
  configDir: "config",              // Diretório para db.json
  dataDir: "data",                  // Diretório para arquivos gerados
  dbFile: undefined,                // Nome customizado do arquivo db.json
  legacyConfigFile: undefined,      // Caminho customizado do config legado
  providersFile: undefined,         // Caminho customizado do opencode.json
  vscodeModelsFile: undefined,      // Caminho customizado do vscode-oaicopilot.json
});
```

**Nota:** Se não for chamado, a inicialização lazy ocorre no primeiro uso.

---

## Operações CRUD (api/crud.ts)

### `readDb() => Promise<DbConfig>`

Lê o arquivo `db.json` completo.

```typescript
const db = await readDb();
// Retorna: { version, litellm, models, agents, categories, globalFallbackModel, customAliases }
```

### `writeDb(config: DbConfig) => Promise<void>`

Escreve o arquivo `db.json` completo. Use com cautela — prefira `updateAgentInDb` para atualizações parciais.

```typescript
await writeDb({ ...db, agents: { ...db.agents, newAgent: { model: "gpt-4o" } } });
```

### `readAgentConfigs() => Promise<Record<string, DbAgentEntry>>`

Lê apenas a seção de agentes do `db.json`.

```typescript
const agents = await readAgentConfigs();
```

### `readCategoryConfigs() => Promise<Record<string, DbCategoryEntry>>`

Lê apenas a seção de categorias do `db.json`.

```typescript
const categories = await readCategoryConfigs();
```

### `readModelSpecs() => Promise<Record<string, DbModelSpec>>`

Lê apenas a seção de modelos do `db.json`.

```typescript
const models = await readModelSpecs();
```

### `readConfigFile() => Promise<AgentConfigFile>`

Lê e transforma a configuração completa para o formato externo (snake_case).

```typescript
const config = await readConfigFile();
// Retorna: { agents: {...}, categories: {...}, globalFallbackModel?: string }
```

### `updateAgentInDb(agentKey: string, config: Partial<AgentConfig>) => Promise<void>`

Atualiza um único agente no `db.json`. Faz merge com dados existentes.

```typescript
await updateAgentInDb("coder", {
  model: "gpt-4o",
  temperature: 0.7,
  description: "Agente de escrita de código",
});
```

**Aliases:** `updateAgentInConfig` (compatibilidade retroativa)

### `updateCategoryInDb(categoryKey: string, config: Partial<CategoryConfig>) => Promise<void>`

Atualiza uma única categoria no `db.json`. Faz merge com dados existentes.

```typescript
await updateCategoryInDb("reasoning", {
  model: "o3",
  thinking: { type: "enabled", budgetTokens: 16000 },
});
```

**Aliases:** `updateCategoryInConfig` (compatibilidade retroativa)

### `updateGlobalFallbackInDb(globalFallbackModel: string) => Promise<void>`

Define o modelo fallback global.

```typescript
await updateGlobalFallbackInDb("gpt-4o-mini");
```

### `deleteAgentFromDb(agentKey: string) => Promise<void>`

Deleta um agente do `db.json`.

```typescript
await deleteAgentFromDb("agente-experimental");
```

**Aliases:** `deleteAgentFromConfig` (compatibilidade retroativa)

### `deleteCategoryFromDb(categoryKey: string) => Promise<void>`

Deleta uma categoria do `db.json`.

```typescript
await deleteCategoryFromDb("categoria-deprecada");
```

**Aliases:** `deleteCategoryFromConfig` (compatibilidade retroativa)

### `writeFullConfig(config: AgentConfigFile) => Promise<void>`

Escreve a configuração completa do formato externo. Substitui todos os agentes/categorias.

```typescript
await writeFullConfig({
  agents: {
    coder: { model: "gpt-4o" },
    reviewer: { model: "claude-3-5-sonnet" },
  },
  categories: {
    fast: { model: "gpt-4o-mini" },
  },
});
```

---

## Sincronização LiteLLM (api/litellm-sync.ts)

### `syncToLiteLLM(opcoes?) => Promise<void>`

Sincroniza configurações de modelos com o banco de dados LiteLLM.

```typescript
import { syncToLiteLLM } from "@lite-llm/agents-manager";

interface LiteLLMSyncOptions {
  force?: boolean;           // Forçar sincronização mesmo se atualizado
  modelFilter?: string[];    // Sincronizar apenas modelos específicos
}

await syncToLiteLLM({ force: true, modelFilter: ["gpt-4o", "claude-3-5-sonnet"] });
```

---

## Geração de Configuração para Consumidores (api/providers.ts)

### `writeProvidersFile() => Promise<void>`

Gera `data/opencode.json` a partir do `db.json`.

```typescript
import { writeProvidersFile } from "@lite-llm/agents-manager";

await writeProvidersFile();
// Escreve: { provider: { litellm: {...}, coder: {...}, [agentKey]: {...} } }
```

---

## Geração VS Code (api/vscode.ts)

### `writeVscodeModelsFile() => Promise<void>`

Gera `data/vscode-oaicopilot.json` a partir do `db.json`.

```typescript
import { writeVscodeModelsFile } from "@lite-llm/agents-manager";

await writeVscodeModelsFile();
// Escreve: { oaicopilot.* settings, oaicopilot.models: [...] }
```

---

## Sincronização de Output (api/sync.ts)

### `syncOutputConfigFile() => Promise<void>`

Sincroniza `db.json` para `data/oh-my-openagent.json` (formato legado).

```typescript
import { syncOutputConfigFile } from "@lite-llm/agents-manager";

await syncOutputConfigFile();
```

---

## Adapters (adapters/)

### `createAgentAdapter() => AgentAdapter`

Cria um adapter para converter entre formatos DB e API para agentes.

```typescript
import { createAgentAdapter } from "@lite-llm/agents-manager";

const adapter = createAgentAdapter();

// Formato DB → Formato API
const apiConfig = adapter.toApi({
  model: "gpt-4o",
  fallbackModels: ["gpt-4o-mini"],
  temperature: 0.7,
});
// { model: "gpt-4o", fallback_models: ["gpt-4o-mini"], temperature: 0.7 }

// Formato API → Formato DB
const dbEntry = adapter.toDb({
  model: "gpt-4o",
  fallback_models: ["gpt-4o-mini"],
});
// { model: "gpt-4o", fallbackModels: ["gpt-4o-mini"] }
```

### `createCategoryAdapter() => CategoryAdapter`

Cria um adapter para converter entre formatos DB e API para categorias.

```typescript
import { createCategoryAdapter } from "@lite-llm/agents-manager";

const adapter = createCategoryAdapter();
// Mesmos métodos toApi/toDb do AgentAdapter
```

---

## Geradores (generators/)

### `createProvidersGenerator(providersFile: string) => ProvidersGenerator`

Cria um gerador para arquivos de provider OpenCode.

```typescript
import { createProvidersGenerator } from "@lite-llm/agents-manager";

const generator = createProvidersGenerator("./data/opencode.json");
await generator.write();
```

### `createVscodeModelsGenerator(vscodeModelsFile: string) => VscodeModelsGenerator`

Cria um gerador para arquivos de modelos VS Code.

```typescript
import { createVscodeModelsGenerator } from "@lite-llm/agents-manager";

const generator = createVscodeModelsGenerator("./data/vscode-oaicopilot.json");
await generator.write();
```

---

## Transformers (transformers/)

### `createAgentTransformer() => AgentTransformer`

Cria um transformer para converter agentes DB para formato de output.

```typescript
import { createAgentTransformer } from "@lite-llm/agents-manager";

const transformer = createAgentTransformer();

const output = transformer.toOutput(
  { coder: { model: "gpt-4o", description: "Agente de código" } },
  "gpt-4o-mini"  // globalFallbackModel
);
// Adiciona aliases de modelo: coder/gpt-4o, coder/gpt-4o-mini, etc.
```

### `createCategoryTransformer() => CategoryTransformer`

Cria um transformer para converter categorias DB para formato de output.

```typescript
import { createCategoryTransformer } from "@lite-llm/agents-manager";

const transformer = createCategoryTransformer();
// Mesmo método toOutput do AgentTransformer
```

---

## Storage (storage/)

### `createFileStorage(caminhos, projectRoot?) => FileStorage`

Cria uma instância de storage de arquivos com configuração de caminhos.

```typescript
import { createFileStorage } from "@lite-llm/agents-manager";

const storage = createFileStorage({
  configDir: "config",
  dataDir: "data",
  // ... outros caminhos
}, "/caminho/para/projeto");

const content = await storage.read();
await storage.write(content);
```

**Interface FileStorage:**
```typescript
interface IFileStorage {
  read(): Promise<DbConfig>;              // Ler db.json
  write(config: DbConfig): Promise<void>; // Escrever db.json
  getPaths(): FilePaths;                 // Obter todos os caminhos resolvidos
}
```
