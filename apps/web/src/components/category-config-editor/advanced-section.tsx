import type { CategoryEntry } from "@lite-llm/api-contracts/category";
import { ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

type AdvancedSectionProps = {
  category: CategoryEntry;
  expandedSections: Record<string, boolean>;
  onToggleSection: (section: string) => void;
  onUpdate: <K extends keyof CategoryEntry>(
    field: K,
    value: CategoryEntry[K],
  ) => void;
};

export function AdvancedSection({
  category,
  expandedSections,
  onToggleSection,
  onUpdate,
}: AdvancedSectionProps) {
  const renderSection = (
    id: string,
    title: string,
    content: React.ReactNode,
  ) => (
    <div className="border rounded-lg">
      <Button
        variant="ghost"
        className="w-full justify-between px-4 py-2 h-auto font-medium"
        onClick={() => onToggleSection(id)}
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            expandedSections[id] ? "rotate-180" : ""
          }`}
        />
      </Button>
      {expandedSections[id] && (
        <div className="px-4 pb-4 space-y-3">{content}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Advanced</h4>

      {renderSection(
        "thinking",
        "Thinking Configuration",
        <div className="space-y-2">
          <Label htmlFor="cat-thinking-levels">Thinking Levels</Label>
          <Input
            id="cat-thinking-levels"
            value={category.thinking?.levels?.join(", ") ?? ""}
            onChange={(e) =>
              onUpdate("thinking", {
                levels: e.target.value
                  .split(",")
                  .map((l) => l.trim())
                  .filter(Boolean),
              })
            }
            placeholder="comma-separated levels"
          />
          <p className="text-xs text-muted-foreground">
            Configure thinking levels for this category
          </p>
        </div>,
      )}

      {renderSection(
        "reasoning",
        "Reasoning & Verbosity",
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cat-reasoning">Reasoning Effort</Label>
            <select
              id="cat-reasoning"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={category.reasoningEffort ?? "medium"}
              onChange={(e) =>
                onUpdate(
                  "reasoningEffort",
                  e.target.value as "low" | "medium" | "high" | "xhigh",
                )
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="xhigh">Extra High</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-verbosity">Text Verbosity</Label>
            <select
              id="cat-verbosity"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={category.textVerbosity ?? "medium"}
              onChange={(e) =>
                onUpdate(
                  "textVerbosity",
                  e.target.value as "low" | "medium" | "high",
                )
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>,
      )}

      {renderSection(
        "flags",
        "Flags & Stability",
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={category.is_unstable_agent ?? false}
              onChange={(e) => onUpdate("is_unstable_agent", e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">Unstable Agent</span>
          </label>
          <p className="text-xs text-muted-foreground">
            Mark as experimental or unstable
          </p>
        </div>,
      )}

      {renderSection(
        "prompt",
        "Prompt Configuration",
        <div className="space-y-2">
          <Label htmlFor="cat-prompt-append">Prompt Append</Label>
          <Textarea
            id="cat-prompt-append"
            value={category.prompt_append ?? ""}
            onChange={(e) => onUpdate("prompt_append", e.target.value)}
            rows={3}
            placeholder="Text to append to all prompts"
          />
        </div>,
      )}

      {renderSection(
        "tools",
        "Tools Configuration",
        <div className="space-y-2">
          <Label htmlFor="cat-tools">Tools (JSON)</Label>
          <Textarea
            id="cat-tools"
            value={
              category.tools ? JSON.stringify(category.tools, null, 2) : "{}"
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || "{}");
                onUpdate("tools", parsed);
              } catch {
                // Invalid JSON, ignore
              }
            }}
            rows={4}
            placeholder='{"tool_name": true}'
          />
          <p className="text-xs text-muted-foreground">
            Enable/disable tools for this category
          </p>
        </div>,
      )}
    </div>
  );
}
