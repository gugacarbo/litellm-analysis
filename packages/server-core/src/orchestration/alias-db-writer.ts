import type { AliasDbWriter } from "@lite-llm/agents-manager";
import type { AnalyticsDataSource } from "@lite-llm/analytics/types";

export class AliasDbWriterImpl implements AliasDbWriter {
  constructor(private dataSource: AnalyticsDataSource) {}

  async updateAliases(aliases: Record<string, string>): Promise<void> {
    await this.dataSource.updateAgentRoutingConfig(aliases);
  }
}
