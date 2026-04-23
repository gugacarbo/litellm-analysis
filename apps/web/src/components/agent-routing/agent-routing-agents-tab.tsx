import {
  ChevronDown,
  ChevronUp,
  Database,
  FolderOpen,
  Palette,
  Zap,
} from 'lucide-react';
import type {
  AgentDefinition,
  CategoryDefinition,
} from '../../types/agent-routing';
import { Button } from '../button';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
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

type AgentRoutingAgentsTabProps = {
  loading: boolean;
  error: string | null;
  saving: boolean;
  categoriesVisible: boolean;
  agents: AgentDefinition[];
  categories: CategoryDefinition[];
  onToggleCategories: () => void;
  onOpenAgentConfig: (key: string) => void;
  onDeleteAgentConfig: (key: string) => void;
  onOpenCategoryConfig: (key: string) => void;
  onDeleteCategoryConfig: (key: string) => void;
  getAgentConfigInfo: (key: string) => ConfigInfo | null;
  getCategoryConfigInfo: (key: string) => ConfigInfo | null;
};

export function AgentRoutingAgentsTab({
  loading,
  error,
  saving,
  categoriesVisible,
  agents,
  categories,
  onToggleCategories,
  onOpenAgentConfig,
  onDeleteAgentConfig,
  onOpenCategoryConfig,
  onDeleteCategoryConfig,
  getAgentConfigInfo,
  getCategoryConfigInfo,
}: AgentRoutingAgentsTabProps) {
  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="p-4 text-destructive">Error: {error}</div>}

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
                            <div className="font-medium">
                              {configInfo.model}
                            </div>
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
                                <FolderOpen className="h-4 w-4" />
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Button
            variant="ghost"
            className="flex items-center justify-between w-full p-0 h-auto"
            onClick={onToggleCategories}
          >
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Categories ({categories.length})
            </CardTitle>
            {categoriesVisible ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </CardHeader>

        {categoriesVisible ? (
          <CardContent>
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
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Configuration</TableHead>
                    <TableHead className="w-25">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => {
                    const configInfo = getCategoryConfigInfo(category.key);
                    return (
                      <TableRow key={category.key}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {configInfo?.description || category.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          {configInfo ? (
                            <div className="text-sm">
                              <div className="font-medium">
                                {configInfo.model}
                              </div>
                              {configInfo.fallbackCount ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                  +{configInfo.fallbackCount} fallbacks
                                </span>
                              ) : null}
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
                                onClick={() =>
                                  onOpenCategoryConfig(category.key)
                                }
                                title="Edit category configuration"
                              >
                                <Palette className="h-4 w-4" />
                              </Button>
                              {configInfo ? (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    onDeleteCategoryConfig(category.key)
                                  }
                                  title="Reset to default"
                                  disabled={saving}
                                >
                                  <FolderOpen className="h-4 w-4" />
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
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
