---
status: accepted
# allowed values: draft | accepted | implemented | deprecated
# do not skip states; only move to implemented after Phase 7 closes.
date: 2026-07-01
builds-on: []
# List ADRs/decisions this spec relies on. The spec CONSUMES decisions;
# it does not redefine them here.
implemented-by: []
# Filled in at close: real paths (code, migrations, functions) that deliver this spec.
---

# Manual model routing aliases can be created from a model detail page and managed from a global aliases view

## Objective

Allow operators to create manual routing aliases such as
`glm-5.2-max -> glm-5.2` directly from the base model detail page, while also
providing a global view to search, review, and remove aliases across the app.
These aliases are internal routing names only; they do not create mirror model
records, model metadata, or analytics identities of their own.

## Flow

1. An operator opens a model detail page for an existing model such as
   `glm-5.2`.
2. The page shows a manual aliases section listing aliases that currently route
   to that model.
3. The operator adds one or more alias names and saves the model.
4. The server validates each alias, updates manual alias storage, and preserves
   unrelated plugin-generated aliases already present in
   `router_settings.model_group_alias`.
5. The model detail page reloads and shows the saved aliases for that model.
6. A global aliases view under the models area lists all manual aliases with
   search/filter support, target model name, and remove actions.
7. When an operator removes an alias from either surface, the alias stops
   resolving immediately after a successful save.
8. When an operator renames a base model through the app, all manual aliases
   targeting that model are retargeted to the new model name in the same write.

## Contract

### Storage

- Source of truth remains
  `model_proxy_settings.key = "router_settings"` and
  `router_settings.value.model_group_alias`.
- Manual aliases are tracked explicitly in
  `router_settings.value.__lite_llm_analytics.manualModelAliasKeys` as an array
  of alias keys owned by the dashboard.
- Existing plugin-managed alias tracking in
  `__lite_llm_analytics.managedModelGroupAliasKeys` remains intact and
  independent.
- The dashboard MUST update only manual alias keys that it owns, preserving:
  - plugin-generated aliases
  - unrelated router settings fields

### Alias semantics

- Alias keys are public routing names.
- Alias values are target model names and MUST reference an existing model in
  the registry-backed model catalog.
- Aliases are routing-only and do not create entries in `model_proxy_models`,
  `models.jsonc`, benchmark aliases, or analytics rollups.
- Aliases do not have their own display name, pricing, limits, provider, or
  health-check state.

### Validation rules

- Alias key MUST be a non-empty trimmed string.
- Alias key MUST be unique across all manual and generated aliases.
- Alias key MUST NOT equal the name of any real model.
- Alias key MUST NOT target another alias; targets must resolve to canonical
  model names only.
- Saving a model detail page MAY update aliases targeting that model, but MUST
  NOT rewrite aliases owned by another target model unless the operation is a
  model rename.

### Server API

- The models API gains dedicated manual alias read/write operations instead of
  overloading generic plugin routing writes.
- The model detail API response includes the manual aliases currently targeting
  the requested model.
- The global aliases API response returns a flat list of manual alias entries:
  - `alias`
  - `targetModel`
- Alias mutations return validation errors with actionable messages for:
  - duplicate alias
  - alias/model name collision
  - missing target model
  - alias pointing to another alias

### UI

- The model detail page exposes a manual aliases editor in the model settings
  flow.
- The editor supports list, add, edit, and remove before save.
- The global aliases view is placed in the models area, not in plugins, because
  the operator mental model is "aliases for models".
- The global view supports search by alias and filter by target model.

## Edge cases

| #   | WHEN ⟨trigger⟩ | the system MUST ⟨response⟩ |
| --- | -------------- | -------------------------- |
| 1   | WHEN an operator saves an alias whose name already exists in `model_group_alias` | the system MUST reject the save and identify the conflicting alias key. |
| 2   | WHEN an operator saves an alias whose name matches a real model name | the system MUST reject the save and explain that aliases cannot shadow real models. |
| 3   | WHEN an operator saves an alias pointing to a missing model | the system MUST reject the save and keep the existing aliases unchanged. |
| 4   | WHEN an operator removes one manual alias for a model | the system MUST delete only that alias key and preserve other manual and generated aliases. |
| 5   | WHEN a model is renamed through the dashboard | the system MUST retarget all manual aliases that pointed to the old model name within the same successful update. |
| 6   | WHEN a model with manual aliases is deleted | the system MUST reject deletion until the operator removes or reassigns those aliases. |
| 7   | WHEN plugin export/regeneration updates generated aliases | the system MUST preserve manual aliases and their ownership metadata. |
| 8   | WHEN the model detail page loads for a model with no manual aliases | the system MUST render an empty aliases state without treating generated aliases as editable manual aliases. |

## Questões em aberto

Nenhuma no momento.

## Definition of Done

```bash
pnpm typecheck
pnpm --filter @lite-llm/server test
pnpm --filter @lite-llm/web test
```

## Human review

- Confirm the model detail alias editor copy is clear about routing-only
  behavior.
- Confirm the global aliases view belongs under models and not under plugins.
- Confirm the deletion guard UX is acceptable when a base model still has
  aliases attached.

## Verification

```text
(fill in at close)
```
