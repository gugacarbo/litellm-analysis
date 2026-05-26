export type PluginExecutionStage =
  | "loadPluginConfig"
  | "buildContext"
  | "buildOutput"
  | "validate"
  | "persist"
  | "afterExport";

export class PluginExecutionError extends Error {
  readonly pluginId: string;
  readonly stage: PluginExecutionStage;
  readonly cause: unknown;

  constructor(params: {
    pluginId: string;
    stage: PluginExecutionStage;
    cause: unknown;
  }) {
    super(
      `Plugin execution failed: plugin=${params.pluginId} stage=${params.stage}`,
    );
    this.name = "PluginExecutionError";
    this.pluginId = params.pluginId;
    this.stage = params.stage;
    this.cause = params.cause;
  }
}
