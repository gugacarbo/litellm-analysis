import { ChevronDown, ChevronRight, Database } from "lucide-react";
import { useState } from "react";
import type { CategoryDefinition } from "../../types/agent-routing";
import { Badge } from "../badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../card";
import { CategoryFocusView } from "./category-focus-view";
import { CategoryModelView } from "./category-model-view";

type ConfigInfo = {
  model: string;
  description?: string;
  fallbackCount: number;
};

type Props = {
  loading: boolean;
  categories: CategoryDefinition[];
  models: string[];
  onOpenCategoryConfig: (key: string) => void;
  onQuickModelChange: (categoryKey: string, model: string) => void;
  getCategoryConfigInfo: (key: string) => ConfigInfo | null;
};

export function AgentRoutingCategoriesTab({
  loading,
  categories,
  models,
  onOpenCategoryConfig,
  onQuickModelChange,
  getCategoryConfigInfo,
}: Props) {
  const [showModelStations, setShowModelStations] = useState(false);

  const configuredCategoriesCount = categories.filter((category) => {
    const config = getCategoryConfigInfo(category.key);
    return Boolean(config && config.model !== "Unassigned");
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
        <CardContent className="space-y-6">
          <CategoryFocusView
            loading={loading}
            categories={categories}
            models={models}
            getCategoryConfigInfo={getCategoryConfigInfo}
            onOpenCategoryConfig={onOpenCategoryConfig}
            onQuickModelChange={onQuickModelChange}
          />

          <div className="rounded-lg border">
            <button
              type="button"
              onClick={() => setShowModelStations(!showModelStations)}
              className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Model Stations</span>
                <Badge variant="secondary" className="font-normal">
                  visualização
                </Badge>
              </div>
              {showModelStations ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showModelStations && (
              <div className="border-t p-3">
                <CategoryModelView
                  loading={loading}
                  categories={categories}
                  getCategoryConfigInfo={getCategoryConfigInfo}
                  onOpenCategoryConfig={onOpenCategoryConfig}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
