import { ChevronDown, ChevronUp, Database, Zap } from 'lucide-react';
import type {
  AgentDefinition,
  CategoryDefinition,
} from '../../types/agent-routing';
import { Badge } from '../badge';
import { Button } from '../button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../card';
import { AgentsTable } from './agents-table';
import { CategoriesTable } from './categories-table';

type ConfigInfo = {
  model: string;
  description?: string;
  color?: string;
  fallbackCount: number;
};

type Props = {
  loading: boolean;
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
}: Props) {
  const configuredAgentsCount = agents.filter((agent) => {
    const config = getAgentConfigInfo(agent.key);
    return Boolean(config && config.model !== 'Unassigned');
  }).length;

  const configuredCategoriesCount = categories.filter((category) => {
    const config = getCategoryConfigInfo(category.key);
    return Boolean(config && config.model !== 'Unassigned');
  }).length;

  return (
    <div className="space-y-4 mt-4">
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
            saving={saving}
            agents={agents}
            getAgentConfigInfo={getAgentConfigInfo}
            onOpenAgentConfig={onOpenAgentConfig}
            onDeleteAgentConfig={onDeleteAgentConfig}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Button
            variant="ghost"
            className="h-auto w-full justify-between p-0"
            onClick={onToggleCategories}
          >
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <div className="text-start">
                <CardTitle>Categories ({categories.length})</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {configuredCategoriesCount}/{categories.length} configured
                </p>
              </div>
            </div>
            {categoriesVisible ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </CardHeader>

        {categoriesVisible ? (
          <CardContent>
            <CategoriesTable
              loading={loading}
              saving={saving}
              categories={categories}
              getCategoryConfigInfo={getCategoryConfigInfo}
              onOpenCategoryConfig={onOpenCategoryConfig}
              onDeleteCategoryConfig={onDeleteCategoryConfig}
            />
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
