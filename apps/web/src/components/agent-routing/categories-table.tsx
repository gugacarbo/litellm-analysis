import { Palette } from 'lucide-react';
import type { CategoryDefinition } from '../../types/agent-routing';
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
  fallbackCount: number;
};

type CategoriesTableProps = {
  loading: boolean;
  saving: boolean;
  categories: CategoryDefinition[];
  getCategoryConfigInfo: (key: string) => ConfigInfo | null;
  onOpenCategoryConfig: (key: string) => void;
  onDeleteCategoryConfig: (key: string) => void;
};

export function CategoriesTable({
  loading,
  saving,
  categories,
  getCategoryConfigInfo,
  onOpenCategoryConfig,
  onDeleteCategoryConfig,
}: CategoriesTableProps) {
  return loading ? (
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
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>
                <div className="max-w-xs truncate">
                  {configInfo?.description || category.description}
                </div>
              </TableCell>
              <TableCell>
                {configInfo ? (
                  <div className="text-sm">
                    <div className="font-medium">{configInfo.model}</div>
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
                      onClick={() => onOpenCategoryConfig(category.key)}
                      title="Edit category configuration"
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                    {configInfo ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDeleteCategoryConfig(category.key)}
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
  );
}
