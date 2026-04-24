import type { CategoryConfig } from '../../types/agent-routing';
import { Input } from '../input';
import { Label } from '../label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';

type Props = {
  config: CategoryConfig;
  onUpdateConfig: (
    field: keyof CategoryConfig,
    value: CategoryConfig[keyof CategoryConfig],
  ) => void;
  onUpdateThinkingConfig: (
    field: keyof NonNullable<CategoryConfig['thinking']>,
    value: NonNullable<CategoryConfig['thinking']>[keyof NonNullable<
      CategoryConfig['thinking']
    >],
  ) => void;
};

export function CategoryConfigEditorAdvancedSection({
  config,
  onUpdateConfig,
  onUpdateThinkingConfig,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Advanced Settings</h3>
        <p className="text-xs text-muted-foreground">
          Reasoning depth, verbosity and thinking budget controls.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reasoningEffort">Reasoning Effort</Label>
          <Select
            value={config.reasoningEffort || ''}
            onValueChange={(value: 'low' | 'medium' | 'high' | 'xhigh') =>
              onUpdateConfig('reasoningEffort', value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select effort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="xhigh">Extra High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="textVerbosity">Text Verbosity</Label>
          <Select
            value={config.textVerbosity || ''}
            onValueChange={(value: 'low' | 'medium' | 'high') =>
              onUpdateConfig('textVerbosity', value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select verbosity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="thinking-type">Thinking</Label>
          <Select
            value={config.thinking?.type || 'enabled'}
            onValueChange={(value: 'enabled' | 'disabled') =>
              onUpdateThinkingConfig('type', value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budgetTokens">Budget Tokens</Label>
          <Input
            id="budgetTokens"
            type="number"
            min="0"
            value={config.thinking?.budgetTokens ?? ''}
            onChange={(e) =>
              onUpdateThinkingConfig(
                'budgetTokens',
                e.target.value ? parseInt(e.target.value, 10) : undefined,
              )
            }
            placeholder="Token budget"
          />
        </div>
      </div>
    </section>
  );
}
