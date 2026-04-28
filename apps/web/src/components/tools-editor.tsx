import { Plus, Trash2 } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

type ToolsEditorProps = {
  tools: Record<string, boolean>;
  onUpdateTools: (tools: Record<string, boolean>) => void;
  newToolKey: string;
  onNewToolKeyChange: (key: string) => void;
  newToolValue: string;
  onNewToolValueChange: (value: string) => void;
};

export function ToolsEditor({
  tools,
  onUpdateTools,
  newToolKey,
  onNewToolKeyChange,
  newToolValue,
  onNewToolValueChange,
}: ToolsEditorProps) {
  const hasTools = tools && Object.keys(tools).length > 0;

  const handleAddTool = () => {
    if (!newToolKey.trim()) return;
    onUpdateTools({
      ...tools,
      [newToolKey.trim()]: newToolValue === "true",
    });
    onNewToolKeyChange("");
  };

  const handleRemoveTool = (key: string) => {
    const newTools = { ...tools };
    delete newTools[key];
    onUpdateTools(newTools);
  };

  const handleUpdateToolValue = (key: string, value: string) => {
    onUpdateTools({
      ...tools,
      [key]: value === "true",
    });
  };

  return (
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
          <Select value={newToolValue} onValueChange={onNewToolValueChange}>
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
            onClick={handleAddTool}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {hasTools ? (
        <div className="space-y-2">
          {Object.entries(tools).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <Badge variant="secondary" className="px-2 py-1">
                {key}
              </Badge>
              <Select
                value={value.toString()}
                onValueChange={(v) => handleUpdateToolValue(key, v)}
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
                onClick={() => handleRemoveTool(key)}
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
  );
}
