import { ChevronDown, ChevronUp, Database, Zap } from 'lucide-react';
import type {
  AgentDefinition,
  CategoryDefinition,
} from '../../types/agent-routing';
import { Button } from '../button';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
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
