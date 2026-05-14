# LiteLLM Alias Plugin Settings Screen

## Context

The `LitellmAliasPlugin` generates `model_group_alias` configuration for LiteLLM's router. Users need fine-grained control over which agents and categories are included in alias generation — not just all-or-nothing toggles.

## Design

### Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `aliasPrefix` | `string` | `""` | Text prepended to every generated alias key |
| `includeAgents` | `boolean` | `true` | Master toggle for agent-based aliases |
| `selectedAgents` | `string[]` | `[]` (all) | Which agent IDs to include (empty = all) |
| `includeCategories` | `boolean` | `true` | Master toggle for category-based aliases |
| `selectedCategories` | `string[]` | `[]` (all) | Which category keys to include (empty = all) |
| `globalFallbackOverride` | `string` | `""` | Override global fallback model (empty = use default) |

### Behavior

**`buildOutput()` logic:**
- If `includeAgents` is `false`: skip agent alias generation entirely
- If `includeAgents` is `true` AND `selectedAgents` is non-empty: only include agents whose `id` is in `selectedAgents`
- If `includeAgents` is `true` AND `selectedAgents` is empty: include all agents
- Same pattern for `includeCategories` / `selectedCategories` (filter by category key)
- If `globalFallbackOverride` is non-empty, use it instead of `ctx.globalFallbackModel`

**`getConfigSchema()`:** returns all 6 fields above

**`getInternalAgents()`:** remains `[]`

### UI

The existing plugin config page at `/plugins/litellm-alias` renders via `PluginConfigForm`. The `select` field type renders a dropdown. Since `selectedAgents` and `selectedCategories` are `string[]`, the frontend multi-select handling must be implemented — the existing `PluginConfigForm` may need a multi-select enhancement, or the config can store comma-separated strings.

### Files to Modify

| File | Change |
|------|--------|
| `packages/agents-manager/src/plugins/external/litellm-alias.plugin.ts` | Update `getConfigSchema()` (add 2 fields), update `buildOutput()` to filter by `selectedAgents` / `selectedCategories` |

### Out of Scope

- New frontend components (may need multi-select enhancement in `PluginConfigForm`)
- Changing the `AliasDbWriter` interface
- Agent mapping UI (this plugin has no internal agents)
