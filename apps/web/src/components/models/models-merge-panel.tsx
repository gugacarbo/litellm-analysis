import type { ModelWithStatus } from "../../lib/api-client/models";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type ModelsMergePanelProps = {
  models: ModelWithStatus[];
  sourceModel: string;
  targetModel: string;
  merging: boolean;
  onSourceModelChange: (model: string) => void;
  onTargetModelChange: (model: string) => void;
  onMerge: () => void;
};

export function ModelsMergePanel({
  models,
  sourceModel,
  targetModel,
  merging,
  onSourceModelChange,
  onTargetModelChange,
  onMerge,
}: ModelsMergePanelProps) {
  const modelNames = models.map((m) => m.modelName).sort();

  return (
    <Card>
      <CardContent className="pt-4 flex items-center gap-2 flex-wrap">
        <Select value={sourceModel} onValueChange={onSourceModelChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Source model" />
          </SelectTrigger>
          <SelectContent>
            {modelNames.map((name) => (
              <SelectItem
                key={name}
                value={name}
                disabled={name === targetModel}
              >
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span>→</span>

        <Select value={targetModel} onValueChange={onTargetModelChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Target model" />
          </SelectTrigger>
          <SelectContent>
            {modelNames.map((name) => (
              <SelectItem
                key={name}
                value={name}
                disabled={name === sourceModel}
              >
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="default"
          disabled={merging || !sourceModel || !targetModel}
          onClick={onMerge}
        >
          {merging ? "Merging..." : "Merge"}
        </Button>
      </CardContent>
    </Card>
  );
}
