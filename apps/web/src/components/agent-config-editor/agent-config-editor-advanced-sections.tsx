import type { AgentConfig } from '../../types/agent-routing';
import { Separator } from '../separator';
import { AgentConfigEditorExecutionSection } from './agent-config-editor-execution-section';
import { AgentConfigEditorPermissionsSection } from './agent-config-editor-permissions-section';

type Props = {
  config: AgentConfig;
  expandedSections: Record<string, boolean>;
  newSkill: string;
  newToolKey: string;
  newToolValue: boolean;
  onToggleSection: (section: string) => void;
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
  expandedSections,
  newSkill,
  newToolKey,
  newToolValue,
  onToggleSection,
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
        expanded={expandedSections.execution}
        onToggle={() => onToggleSection('execution')}
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
        expanded={expandedSections.permissions}
        onToggle={() => onToggleSection('permissions')}
        onUpdateConfig={onUpdateConfig}
      />
    </>
  );
}
