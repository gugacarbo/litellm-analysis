import type { ModelStats } from '../../pages/model-stats/model-stats-types';
import { Button } from '../button';
import { Card, CardContent } from '../card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';

type ModelStatsMergePanelProps = {
  data: ModelStats[];
  sourceModel: string;
  targetModel: string;
  merging: boolean;
  onSourceModelChange: (model: string) => void;
  onTargetModelChange: (model: string) => void;
  onMerge: () => void;
};

export function ModelStatsMergePanel({
  data,
  sourceModel,
  targetModel,
  merging,
  onSourceModelChange,
  onTargetModelChange,
  onMerge,
}: ModelStatsMergePanelProps) {
  const models = data.filter((m) => m.model);

  return (
    <Card>
      <CardContent className="pt-4 flex items-center gap-2 flex-wrap">
        <Select value={sourceModel} onValueChange={onSourceModelChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Source model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem
                key={m.model}
                value={m.model}
                disabled={m.model === targetModel}
              >
                {m.model}
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
            {models.map((m) => (
              <SelectItem
                key={m.model}
                value={m.model}
                disabled={m.model === sourceModel}
              >
                {m.model}
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
          {merging ? 'Merging...' : 'Merge'}
        </Button>
      </CardContent>
    </Card>
  );
}
