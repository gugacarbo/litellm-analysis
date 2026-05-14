/**
 * Plugin Output Schema Registry
 *
 * Central registry for all plugin output schemas.
 * Provides both JSON Schema (for validation) and Zod schemas (for runtime validation).
 *
 * Usage:
 *   import { pluginSchemas } from "./plugin-schemas";
 *   const jsonSchema = pluginSchemas.opencode.json;
 *   const zodSchema = pluginSchemas.opencode.zod;
 */

import { type OpenAgent, openAgentSchema } from "./generated/openagent.zod";
import { type OpenCode, openCodeSchema } from "./generated/opencode.zod";
import { type VsCode, vsCodeSchema } from "./generated/vscode.zod";
import openagentJsonSchema from "./openagent.schema.json";
import opencodeJsonSchema from "./opencode.schema.json";
import vscodeJsonSchema from "./vscode.schema.json";

export interface PluginSchemas {
  opencode: {
    /** JSON Schema draft-07 object for validation */
    json: typeof opencodeJsonSchema;
    /** Zod schema for TypeScript-first validation */
    zod: typeof openCodeSchema;
    /** TypeScript type inferred from the Zod schema */
    outputType: OpenCode;
  };
  openagent: {
    json: typeof openagentJsonSchema;
    zod: typeof openAgentSchema;
    outputType: OpenAgent;
  };
  vscode: {
    json: typeof vscodeJsonSchema;
    zod: typeof vsCodeSchema;
    outputType: VsCode;
  };
}

/**
 * Registry of all plugin output schemas
 */
export const pluginSchemas: PluginSchemas = {
  opencode: {
    json: opencodeJsonSchema,
    zod: openCodeSchema,
    outputType: null as unknown as OpenCode,
  },
  openagent: {
    json: openagentJsonSchema,
    zod: openAgentSchema,
    outputType: null as unknown as OpenAgent,
  },
  vscode: {
    json: vscodeJsonSchema,
    zod: vsCodeSchema,
    outputType: null as unknown as VsCode,
  },
};

export type PluginId = keyof PluginSchemas;
