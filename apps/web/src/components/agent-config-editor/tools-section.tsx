import type { SystemAgent } from "@lite-llm/contracts/agent-routing";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

interface ToolsSectionProps {
  config: SystemAgent;
  onConfigFieldChange: (field: string, value: unknown) => void;
}

export function ToolsSection({
  config,
  onConfigFieldChange,
}: ToolsSectionProps) {
  const [newToolName, setNewToolName] = useState("");
  const [newSkillName, setNewSkillName] = useState("");

  const tools = config.config.tools ?? {};
  const skills = config.config.skills ?? [];

  const toggleTool = (toolName: string, enabled: boolean) => {
    onConfigFieldChange("tools", { ...tools, [toolName]: enabled });
  };

  const addTool = () => {
    if (newToolName.trim() && !Object.hasOwn(tools, newToolName.trim())) {
      onConfigFieldChange("tools", { ...tools, [newToolName.trim()]: false });
      setNewToolName("");
    }
  };

  const removeTool = (toolName: string) => {
    const newTools = { ...tools };
    delete newTools[toolName];
    onConfigFieldChange("tools", newTools);
  };

  const addSkill = () => {
    if (newSkillName.trim() && !skills.includes(newSkillName.trim())) {
      onConfigFieldChange("skills", [...skills, newSkillName.trim()]);
      setNewSkillName("");
    }
  };

  const removeSkill = (skillName: string) => {
    onConfigFieldChange(
      "skills",
      skills.filter((s) => s !== skillName),
    );
  };

  const toolEntries = Object.entries(tools);

  return (
    <div className="space-y-6">
      {/* Tools Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Tools</Label>
          <span className="text-xs text-muted-foreground">
            Toggle to enable/disable tools
          </span>
        </div>

        <div className="flex gap-2">
          <Input
            value={newToolName}
            onChange={(e) => setNewToolName(e.target.value)}
            placeholder="Add new tool name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTool();
              }
            }}
          />
          <button
            type="button"
            onClick={addTool}
            className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {toolEntries.length > 0 ? (
          <div className="space-y-2 mt-3">
            {toolEntries.map(([toolName, enabled]) => (
              <div
                key={toolName}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
              >
                <span className="text-sm font-mono">{toolName}</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => toggleTool(toolName, checked)}
                  />
                  <button
                    type="button"
                    onClick={() => removeTool(toolName)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            No tools configured. Add tool names above.
          </p>
        )}
      </div>

      {/* Skills Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Skills</Label>
          <span className="text-xs text-muted-foreground">
            Freeform tag input (no external endpoint)
          </span>
        </div>

        <div className="flex gap-2">
          <Input
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Add skill name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-secondary text-secondary-foreground rounded-md"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-muted-foreground hover:text-foreground ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            No skills configured. Add skill names above.
          </p>
        )}
      </div>
    </div>
  );
}
