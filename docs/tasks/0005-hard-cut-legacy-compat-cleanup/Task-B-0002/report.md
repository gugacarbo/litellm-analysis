# Task-B-0002 Report

## Summary

- Removed plugin-routing config normalization that silently converted legacy plugin payloads into current shapes.
- Changed plugin-routing to reject wrapped legacy config payloads and known legacy per-plugin config keys inside this task scope.
- Simplified `PluginRegistryV2` by removing the legacy `getConfigSchema()` API and keeping JSON Schema as the active config contract.
- Removed the `model-alias` LiteLLM-specific prefix stripping helper so model ids are no longer rewritten for historical compatibility.
- Kept `model-alias` itself in place because it still has active consumers outside this task's write scope, including current app UI and orchestration surfaces.

## Files Changed

- `packages/server/src/routes/plugin-routing-routes.ts`
- `services/agent-plugins/src/plugin-registry.ts`
- `services/agent-plugins/src/__tests__/plugin-registry-v2.test.ts`
- `services/agent-plugins/src/plugins/model-alias/generate.ts`
- `services/agent-plugins/src/plugins/model-alias/__tests__/plugin.test.ts`
- Deleted `services/agent-plugins/src/plugins/model-alias/utils/strip-prefix.ts`

## Tests Run / Results

- `pnpm test -- --run agent-plugins`
  - Failed due to unrelated monorepo filtering behavior: packages without matching tests exited with `No test files found`, specifically `@lite-llm/llm-config-service#test`.
- `pnpm --filter @lite-llm/agent-plugins test -- --run src/__tests__/plugin-registry-v2.test.ts src/plugins/model-alias/__tests__/plugin.test.ts src/plugins/openagent/__tests__/plugin.test.ts src/plugins/opencode/__tests__/plugin.test.ts src/plugins/vscode/__tests__/plugin.test.ts src/plugins/weave/__tests__/plugin.test.ts`
  - Passed: `15` test files, `151` tests passed, `6` skipped.
- `pnpm --filter @lite-llm/agent-plugins build`
  - Passed.
- `pnpm --filter @lite-llm/server build`
  - Passed.

## Follow-up Risks

- `model-alias` still has active consumers outside this task scope, including `apps/web`, `apps/server`, `packages/server/src/orchestration`, and `services/agent-plugins` export/catalog surfaces. Fully deleting the plugin would require a broader coordinated cut across those consumers.
- `plugin-routing` still returns empty `configSchema` arrays to preserve the current response shape for out-of-scope consumers, even though the active config contract is now JSON Schema via `/plugin-routing/:pluginId/schema`.
