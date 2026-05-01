---
name: qdrant-search
description: Semantic memory and vector retrieval workflow for codebases using Qdrant. Use this skill whenever the user asks for semantic search, RAG, long-term memory, codebase indexing, contextual retrieval before editing code, or MCP-based memory with qdrant-find/qdrant-store. Prefer this skill even if the user only mentions "search similar code", "reuse prior fix", "store findings", "agent memory", or "vector database".
license: MIT
compatibility: Requires a configured Qdrant endpoint and MCP tools for retrieval/storage (for example qdrant-find and qdrant-store).
---

# Qdrant Vector Search for Codebase Memory

Use this skill to turn Qdrant into reliable semantic memory for coding agents.

The goal is simple: retrieve relevant context before making changes, then store
new knowledge with consistent metadata so future tasks become faster and more
accurate.

## When to use

Use this skill when the user asks for any of the following:

- Semantic search across code, docs, logs, or runbooks
- RAG or retrieval-augmented coding workflows
- "Find similar fix", "reuse prior implementation", or "where did we do this?"
- Persistent memory between tasks, sessions, or agents
- Indexing a repository for contextual code assistance
- Improving troubleshooting with historical solutions

## When not to use

- One-off exact text lookup where `rg` is enough
- Tiny tasks with no reuse value and no retrieval need
- Sensitive data ingestion if policy disallows storage

## Default workflow

Follow this sequence unless the user asks otherwise.

1. Retrieval first
- Run semantic lookup before editing code.
- Query using: task intent, feature/module name, likely file paths, and errors.
- If nothing useful appears, broaden query terms once before proceeding.

2. Plan with retrieved context
- Summarize the top matches briefly.
- State what will be reused vs what is outdated.

3. Implement
- Make code changes normally.
- Capture reusable findings while implementing (patterns, pitfalls, decisions).

4. Store memory at the end
- Persist concise summary plus structured metadata.
- Include enough context for future filtering and ranking.

5. Confirm memory result
- Report what was stored and which tags/paths were attached.

## Execution modes

Use this decision order to avoid blocking:

1. MCP mode (preferred)
- Use `qdrant-find` for retrieval and `qdrant-store` for persistence.
- Keep narrative context in the tool text fields.
- Keep structured fields in metadata payload.

2. Direct client mode (allowed when MCP tools are unavailable)
- If the environment cannot call MCP tools, use direct Qdrant client access
  when available (for example `qdrant-client` + local embeddings pipeline).
- Keep the same metadata contract and reporting format.
- Clearly state that MCP was unavailable and direct mode was used.

3. Offline fallback mode
- If neither MCP nor direct client access is available, continue the task using
  local repository evidence.
- Do not block delivery.
- Record pending memory sync actions for later replay.

## Metadata contract for stored items

Always include these fields in metadata when storing code knowledge:

- `repo`: repository name
- `branch`: git branch used during the task
- `path`: file path for the snippet or primary artifact
- `symbol`: function/class/module name when known
- `startLine`: snippet start line
- `endLine`: snippet end line
- `language`: code or document language (`ts`, `tsx`, `sql`, `md`, etc.)
- `commit`: commit SHA when available
- `tags`: short list of domain tags (`routing`, `drizzle`, `agent-config`)
- `code`: minimal snippet or pseudo-snippet that explains the solution
- `summary`: natural-language explanation of behavior/decision

If a field is unknown, store a neutral value (`"unknown"`, `null`, or empty
array) rather than omitting it inconsistently.

## Chunking strategy for code indexing

When indexing files, use stable chunking so retrieval quality stays predictable.

- Target chunk size: 80-180 lines for source code
- Overlap: 20-40 lines
- Prefer semantic boundaries: function/class/module edges
- Keep imports with the first chunk of a file
- Keep error handling with the logic it protects
- Avoid giant chunks with unrelated symbols

For docs/markdown:

- Chunk by heading sections first
- Keep code fences intact
- Include heading path in metadata tags

## Query templates

Use these templates for better recall.

- Implementation lookup:
  - `"<feature> <module> existing implementation <language> <path>"`
- Bug/fix lookup:
  - `"<error message> root cause fix <service> <language>"`
- Refactor lookup:
  - `"refactor pattern for <component> with <constraint>"`
- Cross-file behavior lookup:
  - `"where is <concept> resolved mapped normalized"`

When Qdrant is unavailable, still list the intended retrieval queries in the
report and label them as `planned` rather than `executed`.

## Ranking and filtering guidance

- Prefer results matching same module/path over generic matches
- Prefer newer commit context when conflicts appear
- Boost snippets with concrete symbols and tests
- Down-rank stale results that mention deprecated interfaces

## Output format for the user

When this skill is used in a coding task, report memory activity explicitly:

```txt
Qdrant Memory Report
- Retrieval queries: <n>
- Useful matches: <short bullet list>
- Stored items: <n>
- Stored metadata keys: repo, branch, path, symbol, startLine, endLine, language, commit, tags, code, summary
- Notes: <gaps / fallbacks>
```

For indexing tasks, also include:

```txt
Indexing Summary
- Scope: <folders/files>
- Chunking: <size + overlap + boundary policy>
- Stored points: <n>
- Collection: <collection_name>
```

## Failure and fallback behavior

If Qdrant is unavailable or returns errors:

- Continue the user task without blocking
- Say memory sync/retrieval was unavailable
- Suggest a retry at the end if appropriate
- Never fabricate retrieval results
- Distinguish clearly between:
  - retrieval executed successfully
  - retrieval planned but not executed

## Security and hygiene

- Do not store secrets, tokens, private keys, or raw credentials
- Avoid storing full files when a focused snippet is enough
- Prefer summaries of sensitive incidents over raw secret-bearing logs
- Keep tags short and consistent to avoid taxonomy drift

## Practical notes for MCP usage

If the environment exposes MCP tools like `qdrant-find` and `qdrant-store`:

- Call retrieval before editing
- Call store during/after implementation
- Put narrative context in retrieval/store text fields
- Put structured fields in metadata payload

If direct Qdrant client code is needed, use the references below.



## Full codebase indexing script

This skill ships with an indexing script for full and incremental ingestion:

- Script path: `scripts/index-qdrant-codebase.py` (relative to this skill)
- Runtime deps: `qdrant-client`, `fastembed`
- Defaults:
  - Qdrant URL: `http://localhost:6333`
  - Collection: `lite_llm_analytics_codebase`
  - Model: `sentence-transformers/all-MiniLM-L6-v2`
  - Chunking: `140` lines with `30` overlap

### Usage

From repo root:

```bash
python3 .agents/skills/qdrant-search/scripts/index-qdrant-codebase.py --root . --reset
```

Incremental run (keeps existing points):

```bash
python3 .agents/skills/qdrant-search/scripts/index-qdrant-codebase.py --root .
```

Custom collection or endpoint:

```bash
python3 .agents/skills/qdrant-search/scripts/index-qdrant-codebase.py \
  --root . \
  --qdrant-url http://localhost:6333 \
  --collection lite_llm_analytics_codebase
```

### What it stores

Each point includes required metadata keys:

- `repo`, `branch`, `path`, `symbol`, `startLine`, `endLine`, `language`,
  `commit`, `tags`, `code`, `summary`

### Post-index validation

Check collection status:

```bash
curl -sS http://localhost:6333/collections/lite_llm_analytics_codebase | jq '.result | {status, points_count}'
```

Smoke-test semantic retrieval (Python API):

```bash
python3 - <<'PY'
from fastembed import TextEmbedding
from qdrant_client import QdrantClient

client = QdrantClient(url='http://localhost:6333')
embedder = TextEmbedding(model_name='sentence-transformers/all-MiniLM-L6-v2')
q = next(embedder.embed(['express route validation and query params']))
res = client.query_points(
    collection_name='lite_llm_analytics_codebase',
    query=q.tolist(),
    limit=3,
    with_payload=True,
)
for p in res.points:
    payload = p.payload or {}
    print(payload.get('path'), payload.get('symbol'), f'score={p.score:.4f}')
PY
```

### Notes

- Use `--reset` when you want a clean full rebuild.
- Use incremental mode for daily refreshes after code changes.
- If MCP tools are unavailable, this script is the preferred direct-client mode.


## References

- `references/advanced-usage.md` for distributed, hybrid, and scaling patterns
- `references/troubleshooting.md` for operational/debugging issues
- Qdrant docs: https://qdrant.tech/documentation/
