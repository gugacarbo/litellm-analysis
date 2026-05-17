import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { useQuery } from "@tanstack/react-query";
import { getCategoryCatalog } from "../../lib/api-client/agent-catalog";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Slider } from "../ui/slider";
import { Textarea } from "../ui/textarea";

interface AdvancedSectionProps {
  config: SystemAgent;
  onConfigFieldChange: (field: string, value: unknown) => void;
}

export function AdvancedSection({
  config,
  onConfigFieldChange,
}: AdvancedSectionProps) {
  const { data: categoriesData } = useQuery({
    queryKey: ["category-catalog"],
    queryFn: getCategoryCatalog,
  });

  const categories = Object.keys(categoriesData ?? {});
  const temperature = config.config.temperature ?? 0;
  const topP = config.config.topP ?? 1;

  return (
    <div className="space-y-6">
      {/* Mode and Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agent-mode">Mode</Label>
          <Select
            value={config.config.mode ?? "subagent"}
            onValueChange={(value) =>
              onConfigFieldChange(
                "mode",
                value as "subagent" | "primary" | "all",
              )
            }
          >
            <SelectTrigger id="agent-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="subagent">Subagent</SelectItem>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-category">Category</Label>
          <Select
            value={config.config.category ?? ""}
            onValueChange={(value) =>
              onConfigFieldChange("category", value || undefined)
            }
          >
            <SelectTrigger id="agent-category" className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="temperature">Temperature</Label>
          <span className="text-sm text-muted-foreground font-mono">
            {temperature.toFixed(1)}
          </span>
        </div>
        <Slider
          id="temperature"
          min={0}
          max={2}
          step={0.1}
          value={[temperature]}
          onValueChange={([value]) => onConfigFieldChange("temperature", value)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Precise (0.0)</span>
          <span>Creative (2.0)</span>
        </div>
      </div>

      {/* Top P */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="top-p">Top P</Label>
          <span className="text-sm text-muted-foreground font-mono">
            {topP.toFixed(2)}
          </span>
        </div>
        <Slider
          id="top-p"
          min={0}
          max={1}
          step={0.05}
          value={[topP]}
          onValueChange={([value]) => onConfigFieldChange("topP", value)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Focused (0.0)</span>
          <span>Diverse (1.0)</span>
        </div>
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <Label htmlFor="prompt">System Prompt Override</Label>
        <Textarea
          id="prompt"
          value={config.config.prompt ?? ""}
          onChange={(e) => onConfigFieldChange("prompt", e.target.value)}
          placeholder="Custom system prompt for this agent..."
          rows={4}
        />
      </div>

      {/* Prompt Append */}
      <div className="space-y-2">
        <Label htmlFor="prompt-append">Prompt Append</Label>
        <Textarea
          id="prompt-append"
          value={config.config.promptAppend ?? ""}
          onChange={(e) => onConfigFieldChange("promptAppend", e.target.value)}
          placeholder="Text to append to all prompts..."
          rows={2}
        />
      </div>
    </div>
  );
}
