import { Palette } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AgentDefinition } from '../../types/agent-routing';
import { Badge } from '../badge';
import { Button } from '../button';
import { FeatureGate } from '../feature-gate';
import { Skeleton } from '../skeleton';

type ConfigInfo = {
  model: string;
  description?: string;
  color?: string;
  fallbackCount: number;
};

type AgentsTableProps = {
  loading: boolean;
  agents: AgentDefinition[];
  getAgentConfigInfo: (key: string) => ConfigInfo | null;
  onOpenAgentConfig: (key: string) => void;
};

export function AgentsTable({
  loading,
  agents,
  getAgentConfigInfo,
  onOpenAgentConfig,
}: AgentsTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No agents available.
      </div>
    );
  }

  const rows = agents.map((agent) => {
    const configInfo = getAgentConfigInfo(agent.key);
    return {
      agent,
      configInfo,
      hasPrimaryModel: Boolean(configInfo && configInfo.model !== 'Unassigned'),
    };
  });

  const configuredCount = rows.filter((row) => row.hasPrimaryModel).length;
  const unconfiguredCount = rows.length - configuredCount;
  const totalFallbacks = rows.reduce(
    (sum, row) => sum + (row.configInfo?.fallbackCount || 0),
    0,
  );

  const modelGroupsMap = new Map<string, AgentDefinition[]>();
  for (const row of rows) {
    if (!row.hasPrimaryModel || !row.configInfo) continue;
    const existing = modelGroupsMap.get(row.configInfo.model);
    if (existing) {
      existing.push(row.agent);
    } else {
      modelGroupsMap.set(row.configInfo.model, [row.agent]);
    }
  }

  const modelGroups = Array.from(modelGroupsMap.entries()).sort((a, b) => {
    if (b[1].length !== a[1].length) {
      return b[1].length - a[1].length;
    }
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-xs text-muted-foreground">Configured Agents</p>
          <p className="text-2xl font-semibold">{configuredCount}</p>
          <p className="text-xs text-muted-foreground">
            of {agents.length} total
          </p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
          <p className="text-xs text-muted-foreground">Active Models</p>
          <p className="text-2xl font-semibold">{modelGroups.length}</p>
          <p className="text-xs text-muted-foreground">
            distinct primary models
          </p>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
          <p className="text-xs text-muted-foreground">Fallback Models</p>
          <p className="text-2xl font-semibold">{totalFallbacks}</p>
          <p className="text-xs text-muted-foreground">
            configured across agents
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs text-muted-foreground">Needs Assignment</p>
          <p className="text-2xl font-semibold">{unconfiguredCount}</p>
          <p className="text-xs text-muted-foreground">
            without a primary model
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-gradient-to-br from-muted/35 via-background to-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Model Focus</p>
            <p className="text-xs text-muted-foreground">
              Which agents are currently sharing each primary model.
            </p>
          </div>
          <Badge variant="outline">
            {modelGroups.length} model{modelGroups.length === 1 ? '' : 's'} in
            use
          </Badge>
        </div>

        {modelGroups.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No primary model assigned yet.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {modelGroups.map(([modelName, modelAgents]) => (
              <div key={modelName} className="rounded-lg border bg-card/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-medium break-all">
                    {modelName}
                  </p>
                  <Badge variant="secondary">
                    {modelAgents.length} agent
                    {modelAgents.length === 1 ? '' : 's'}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {modelAgents.map((agent) => (
                    <Badge
                      key={agent.key}
                      variant="outline"
                      className="h-auto py-1"
                    >
                      <span className="me-1">{agent.icon}</span>
                      {agent.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map(({ agent, configInfo, hasPrimaryModel }) => (
          <div
            key={agent.key}
            className={cn(
              'rounded-xl border p-3',
              hasPrimaryModel
                ? 'bg-card'
                : 'border-dashed border-border/80 bg-muted/15',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span>{agent.icon}</span>
                  <p className="font-medium">{agent.name}</p>
                  {configInfo?.color ? (
                    <div
                      className="size-3 rounded-full border border-border shadow-sm"
                      style={{ backgroundColor: configInfo.color }}
                    />
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {configInfo?.description || agent.description}
                </p>
              </div>

              <FeatureGate capability="agentRouting">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onOpenAgentConfig(agent.key)}
                    title="Edit agent configuration"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </div>
              </FeatureGate>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {configInfo ? (
                <Badge
                  variant="outline"
                  className="h-auto max-w-full py-1 font-mono text-xs"
                >
                  {configInfo.model}
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground"
                >
                  Unconfigured
                </Badge>
              )}
              {configInfo?.fallbackCount ? (
                <Badge variant="secondary">
                  +{configInfo.fallbackCount} fallback
                  {configInfo.fallbackCount === 1 ? '' : 's'}
                </Badge>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
