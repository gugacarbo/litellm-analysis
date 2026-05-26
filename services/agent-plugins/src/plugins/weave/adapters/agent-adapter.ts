import type { SystemAgent } from "../../../types";
import type { WEAVE_AGENTS } from "../manifest/manifest";
import type { WeaveSchemaType } from "../schema/schema";
import { modelAdapter } from "./model-adapter";

export function agentAdapter(
  weaveAgent: (typeof WEAVE_AGENTS)[number],
  systemAgent: SystemAgent,
  modelNames: readonly string[],
): NonNullable<WeaveSchemaType["agents"]>[string] {
  const model = systemAgent.model ?? "";
  const modelData = modelAdapter(
    systemAgent.id ?? weaveAgent.id,
    model,
    modelNames,
  );

  return {
    display_name: systemAgent.displayName ?? weaveAgent.displayName,
    ...modelData,
    temperature: systemAgent.config?.temperature ?? 0.2,
    color: systemAgent.config?.color ?? "",
    category: weaveAgent.category,
  };
}
