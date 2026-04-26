import type { AgentConfig } from "../../types/agent-routing";
import { Separator } from "../separator";
import { AgentConfigEditorExecutionSection } from "./agent-config-editor-execution-section";
import { AgentConfigEditorPermissionsSection } from "./agent-config-editor-permissions-section";

type Props = {
  config: AgentConfig;
  newSkill: string;
  newToolKey: string;
  newToolValue: boolean;
  onUpdateConfig: (
    field: keyof AgentConfig,
    value: AgentConfig[keyof AgentConfig],
  ) => void;
  onNewSkillChange: (value: string) => void;
  onNewToolKeyChange: (value: string) => void;
  onNewToolValueChange: (value: boolean) => void;
  onAddSkill: () => void;
  onRemoveSkill: (index: number) => void;
  onAddTool: () => void;
  onRemoveTool: (key: string) => void;
  onUpdateToolValue: (key: string, value: boolean) => void;
};

export function AgentConfigEditorAdvancedSections({
  config,
  newSkill,
  newToolKey,
  newToolValue,
  onUpdateConfig,
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
    <>
      <Separator />
      <AgentConfigEditorExecutionSection
        config={config}
        newSkill={newSkill}
        newToolKey={newToolKey}
        newToolValue={newToolValue}
        onNewSkillChange={onNewSkillChange}
        onNewToolKeyChange={onNewToolKeyChange}
        onNewToolValueChange={onNewToolValueChange}
        onAddSkill={onAddSkill}
        onRemoveSkill={onRemoveSkill}
        onAddTool={onAddTool}
        onRemoveTool={onRemoveTool}
        onUpdateToolValue={onUpdateToolValue}
      />
      <Separator />
      <AgentConfigEditorPermissionsSection
        config={config}
        onUpdateConfig={onUpdateConfig}
      />
    </>
  );
}
