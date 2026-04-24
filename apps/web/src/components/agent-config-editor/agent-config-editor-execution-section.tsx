import { Plus, Trash2 } from 'lucide-react';
import type { AgentConfig } from '../../types/agent-routing';
import { Badge } from '../badge';
import { Button } from '../button';
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
  config: AgentConfig;
  newSkill: string;
  newToolKey: string;
  newToolValue: boolean;
  onNewSkillChange: (value: string) => void;
  onNewToolKeyChange: (value: string) => void;
  onNewToolValueChange: (value: boolean) => void;
  onAddSkill: () => void;
  onRemoveSkill: (index: number) => void;
  onAddTool: () => void;
  onRemoveTool: (key: string) => void;
  onUpdateToolValue: (key: string, value: boolean) => void;
};

export function AgentConfigEditorExecutionSection({
  config,
  newSkill,
  newToolKey,
  newToolValue,
  onNewSkillChange,
  onNewToolKeyChange,
  onNewToolValueChange,
  onAddSkill,
  onRemoveSkill,
  onAddTool,
  onRemoveTool,
  onUpdateToolValue,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Execution Settings</h3>
        <p className="text-xs text-muted-foreground">
          Skills and tool permissions available for this agent.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Skills</Label>
          <div className="flex items-center gap-2">
            <Input
              value={newSkill}
              onChange={(e) => onNewSkillChange(e.target.value)}
              placeholder="Add skill"
              className="h-8 w-40"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddSkill}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {config.skills && config.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {config.skills.map((skill, index) => (
              <Badge
                key={`${skill}-${index}`}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {skill}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => onRemoveSkill(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No skills configured</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Tools</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={newToolKey}
              onChange={(e) => onNewToolKeyChange(e.target.value)}
              placeholder="Key"
              className="h-8 w-32"
            />
            <Select
              value={newToolValue.toString()}
              onValueChange={(value) => onNewToolValueChange(value === 'true')}
            >
              <SelectTrigger className="h-8 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Enabled</SelectItem>
                <SelectItem value="false">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddTool}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {config.tools && Object.keys(config.tools).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(config.tools).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Badge variant="secondary" className="px-2 py-1">
                  {key}
                </Badge>
                <Select
                  value={value.toString()}
                  onValueChange={(v) => onUpdateToolValue(key, v === 'true')}
                >
                  <SelectTrigger className="h-8 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Enabled</SelectItem>
                    <SelectItem value="false">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveTool(key)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tools configured</p>
        )}
      </div>
    </section>
  );
}
