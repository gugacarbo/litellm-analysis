import type {
  AgentDefinition,
  CategoryDefinition,
} from "@lite-llm/api-contracts/agent-routing";
import type { ConfigInfo } from "./agent-routing-types";
import { EntityFocusCard } from "./entity-focus-card";

export type EntityFocusViewProps = {
  loading: boolean;
  entities: (AgentDefinition | CategoryDefinition)[];
  models: string[];
  getConfigInfo: (key: string) => ConfigInfo | null;
  onOpenConfig: (key: string) => void;
  onQuickModelChange: (entityKey: string, model: string) => void;
};

export function EntityFocusView({
  loading,
  entities,
  models,
  getConfigInfo,
  onOpenConfig,
  onQuickModelChange,
}: EntityFocusViewProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (entities.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {entities.map((entity) => (
        <EntityFocusCard
          key={entity.key}
          entityKey={entity.key}
          name={entity.name}
          description={entity.description}
          icon={entity.icon}
          configInfo={getConfigInfo(entity.key)}
          models={models}
          onOpenConfig={onOpenConfig}
          onQuickModelChange={onQuickModelChange}
        />
      ))}
    </div>
  );
}
