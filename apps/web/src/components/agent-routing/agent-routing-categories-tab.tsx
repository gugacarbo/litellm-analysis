import { Database } from 'lucide-react';
import type { CategoryDefinition } from '../../types/agent-routing';
import { Badge } from '../badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../card';
import { CategoriesTable } from './categories-table';

type ConfigInfo = {
  model: string;
  description?: string;
  fallbackCount: number;
};

type Props = {
  loading: boolean;
  saving: boolean;
  categories: CategoryDefinition[];
  onOpenCategoryConfig: (key: string) => void;
  onDeleteCategoryConfig: (key: string) => void;
  getCategoryConfigInfo: (key: string) => ConfigInfo | null;
};

export function AgentRoutingCategoriesTab({
  loading,
  saving,
  categories,
  onOpenCategoryConfig,
  onDeleteCategoryConfig,
  getCategoryConfigInfo,
}: Props) {
  const configuredCategoriesCount = categories.filter((category) => {
    const config = getCategoryConfigInfo(category.key);
    return Boolean(config && config.model !== 'Unassigned');
  }).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Categories
            </CardTitle>
            <Badge variant="outline">
              {configuredCategoriesCount}/{categories.length} configured
            </Badge>
          </div>
          <CardDescription>
            Category-level model distribution and execution defaults.
          </CardDescription>
        </CardHeader>
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
      </Card>
    </div>
  );
}
