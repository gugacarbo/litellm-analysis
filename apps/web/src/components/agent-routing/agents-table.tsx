import { Palette } from 'lucide-react';
import type { AgentDefinition } from '../../types/agent-routing';
import { Button } from '../button';
import { FeatureGate } from '../feature-gate';
import { Skeleton } from '../skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../table';

type ConfigInfo = {
  model: string;
  description?: string;
  color?: string;
  fallbackCount: number;
};

type AgentsTableProps = {
  loading: boolean;
  saving: boolean;
  agents: AgentDefinition[];
  getAgentConfigInfo: (key: string) => ConfigInfo | null;
  onOpenAgentConfig: (key: string) => void;
  onDeleteAgentConfig: (key: string) => void;
};

export function AgentsTable({
  loading,
  saving,
  agents,
  getAgentConfigInfo,
  onOpenAgentConfig,
  onDeleteAgentConfig,
}: AgentsTableProps) {
  return (
    <>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Configuration</TableHead>
              <TableHead className="w-25">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => {
              const configInfo = getAgentConfigInfo(agent.key);
              return (
                <TableRow key={agent.key}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <span>{agent.icon}</span>
                    <span>{agent.name}</span>
                    {configInfo?.color ? (
                      <div
                        className="w-4 h-4 rounded-full border border-border shadow-sm mr-1"
                        style={{ backgroundColor: configInfo.color }}
                      />
                    ) : null}
                    {configInfo?.fallbackCount ? (
                      <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        +{configInfo.fallbackCount} fallbacks
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {configInfo?.description || agent.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    {configInfo ? (
                      <div className="text-sm">
                        <div className="font-medium">{configInfo.model}</div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                        Unconfigured
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <FeatureGate capability="agentRouting">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onOpenAgentConfig(agent.key)}
                          title="Edit agent configuration"
                        >
                          <Palette className="h-4 w-4" />
                        </Button>
                        {configInfo ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onDeleteAgentConfig(agent.key)}
                            title="Reset to default"
                            disabled={saving}
                          >
                            <span className="sr-only">Reset</span>
                          </Button>
                        ) : null}
                      </div>
                    </FeatureGate>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
}
