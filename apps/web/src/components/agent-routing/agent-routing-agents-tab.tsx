import { Zap } from 'lucide-react';
import type { AgentDefinition } from '../../types/agent-routing';
import { Badge } from '../badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../card';
import { AgentsTable } from './agents-table';

type ConfigInfo = {
  model: string;
  description?: string;
  color?: string;
  fallbackCount: number;
};

type Props = {
  loading: boolean;
  agents: AgentDefinition[];
  onOpenAgentConfig: (key: string) => void;
  getAgentConfigInfo: (key: string) => ConfigInfo | null;
};

export function AgentRoutingAgentsTab({
  loading,
  agents,
  onOpenAgentConfig,
  getAgentConfigInfo,
}: Props) {
  const configuredAgentsCount = agents.filter((agent) => {
    const config = getAgentConfigInfo(agent.key);
    return Boolean(config && config.model !== 'Unassigned');
  }).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Agents
            </CardTitle>
            <Badge variant="outline">
              {configuredAgentsCount}/{agents.length} configured
            </Badge>
          </div>
          <CardDescription>
            Focused view of the configured primary models and their assigned
            agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentsTable
            loading={loading}
            agents={agents}
            getAgentConfigInfo={getAgentConfigInfo}
            onOpenAgentConfig={onOpenAgentConfig}
          />
        </CardContent>
      </Card>
    </div>
  );
}
