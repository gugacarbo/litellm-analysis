import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CategoryConfig } from '../../types/agent-routing';
import { Button } from '../button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../collapsible';
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
  expanded: boolean;
  onToggle: () => void;
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
  expanded,
  onToggle,
  onUpdateConfig,
  onUpdateThinkingConfig,
}: Props) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <h3 className="font-semibold">Advanced Settings</h3>
      </div>
      <CollapsibleContent className="mt-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </CollapsibleContent>
    </Collapsible>
  );
}
