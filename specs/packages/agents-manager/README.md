# @lite-llm/agents-manager

Gerenciamento de configuração de agentes/categorias com armazenamento baseado em arquivos.

## Documentação

| Documento                      | Descrição                                   |
| ------------------------------ | ------------------------------------------- |
| [SPEC.md](./SPEC.md)           | Visão geral, arquitetura, responsabilidades |
| [API.md](./API.md)             | Referência da API pública                   |
| [TYPES.md](./TYPES.md)         | Sistema de tipos e interfaces               |
| [DATA-FLOW.md](./DATA-FLOW.md) | Diagramas de fluxo de dados e padrões       |

## Começo Rápido

```typescript
import {
  createAgentsManager,
  readDb,
  updateAgentInDb,
  writeProvidersFile,
} from "@lite-llm/agents-manager";

// Inicializar
createAgentsManager({ projectRoot: process.cwd() });

// Operações CRUD
const db = await readDb();
await updateAgentInDb("coder", { model: "gpt-4o", temperature: 0.7 });

// Gerar configurações para consumidores
await writeProvidersFile();
```

## Funcionalidades Principais

- **Operações CRUD** — Ler/escrever configurações de agentes e categorias
- **Transformação de Formato** — Converter entre formatos DB e API
- **Geração de Configurações** — Gerar configs para OpenCode, VS Code, OpenAgent
- **Sincronização LiteLLM** — Sincronizar modelos com o banco de dados LiteLLM
- **Escritas Atômicas** — Operações de arquivo seguras com `.tmp` + `rename()`

## Estrutura de Arquivos

```
src/
├── adapters/         # Conversão de formato DB ↔ Config
├── api/              # Funções CRUD + gerenciador singleton
├── generators/       # Arquivos de provider (opencode.json, vscode-oaicopilot.json)
├── storage/          # Abstração de I/O de arquivos
├── transformers/     # Conversão de formato DB → output
├── types/            # Interfaces TypeScript
└── index.ts          # Exports
```

## Dependências

- `@lite-llm/alias-router` — Resolução de alias de modelos
- `@lite-llm/config` — Configuração de ambiente
