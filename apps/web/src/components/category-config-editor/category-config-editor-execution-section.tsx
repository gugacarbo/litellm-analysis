import { Plus, Trash2 } from "lucide-react";
import type { CategoryConfig } from "../../types/agent-routing";
import { Badge } from "../badge";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import { Textarea } from "../textarea";

type CategoryConfigEditorExecutionSectionProps = {
  config: CategoryConfig;
  newToolKey: string;
  newToolValue: boolean;
  onUpdateConfig: (
    field: keyof CategoryConfig,
    value: CategoryConfig[keyof CategoryConfig],
  ) => void;
  onNewToolKeyChange: (value: string) => void;
  onNewToolValueChange: (value: boolean) => void;
  onAddTool: () => void;
  onRemoveTool: (key: string) => void;
  onUpdateToolValue: (key: string, value: boolean) => void;
};

export function CategoryConfigEditorExecutionSection({
  config,
  newToolKey,
  newToolValue,
  onUpdateConfig,
  onNewToolKeyChange,
  onNewToolValueChange,
  onAddTool,
  onRemoveTool,
  onUpdateToolValue,
}: CategoryConfigEditorExecutionSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Execution Settings</h3>
        <p className="text-xs text-muted-foreground">
          Prompt append and tools available for this category.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt_append">Prompt Append</Label>
        <Textarea
          id="prompt_append"
          value={config.prompt_append || ""}
          onChange={(e) => onUpdateConfig("prompt_append", e.target.value)}
          placeholder="Enter prompt append"
          rows={6}
        />
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
              onValueChange={(value) => onNewToolValueChange(value === "true")}
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
                  onValueChange={(v) => onUpdateToolValue(key, v === "true")}
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
