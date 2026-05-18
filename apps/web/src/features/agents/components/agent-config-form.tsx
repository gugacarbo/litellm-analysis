import { ChevronDown, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../components/ui/collapsible";

interface AgentConfigFormProps {
  formData: AgentConfigFormData;
  onFormDataChange: (next: Partial<AgentConfigFormData>) => void;
  onSave: () => void;
  onBack: () => void;
  saving: boolean;
  isDirty: boolean;
  isNew: boolean;
}

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({
  title,
  description,
  children,
  defaultOpen = true,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 rounded-lg transition-colors"
        >
          <div>
            <h3 className="font-medium">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AgentConfigForm({
  formData,
  onFormDataChange,
  onSave,
  onBack,
  saving,
  isDirty,
  isNew,
}: AgentConfigFormProps) {
  const handleFieldChange = (field: string, value: unknown) => {
    onFormDataChange({ [field]: value } as Partial<AgentConfigFormData>);
  };

  const handleConfigFieldChange = (field: string, value: unknown) => {
    onFormDataChange({
      config: { ...formData.config, [field]: value },
    } as Partial<AgentConfigFormData>);
  };

  return (
    <div className="space-y-4 p-2">
      {/* ID Field (read-only for existing agents) */}
      {formData.id && (
        <div className="px-1">
          <label className="text-sm text-muted-foreground">
            ID: <code className="text-xs">{formData.id}</code>
          </label>
        </div>
      )}

      {/* General Settings */}
      <Card>
        <Section
          title="General"
          description="Basic agent information"
          defaultOpen={true}
        >
          <GeneralSection
            config={{
              id: formData.id,
              displayName: formData.displayName,
              icon: formData.icon,
              description: formData.description,
              model: formData.model,
              fallbackModels: formData.fallbackModels,
              limits: formData.limits,
              cost: undefined,
              config: {
                mode: formData.config.mode,
                tools: formData.config.tools,
                permissions: formData.config.permissions,
                color: formData.config.color,
                disable: formData.config.disable,
                variant: formData.config.variant,
                category: formData.config.category,
                skills: formData.config.skills,
                temperature: formData.config.temperature,
                topP: formData.config.topP,
                prompt: formData.config.prompt,
                promptAppend: formData.config.promptAppend,
              },
            }}
            onFieldChange={handleFieldChange}
          />
        </Section>
      </Card>

      {/* Model Settings */}
      <Card>
        <Section
          title="Model"
          description="Primary model and fallback configuration"
          defaultOpen={true}
        >
          <ModelSection
            config={{
              id: formData.id,
              displayName: formData.displayName,
              icon: formData.icon,
              description: formData.description,
              model: formData.model,
              fallbackModels: formData.fallbackModels,
              limits: formData.limits,
              cost: undefined,
              config: {
                mode: formData.config.mode,
                tools: formData.config.tools,
                permissions: formData.config.permissions,
                color: formData.config.color,
                disable: formData.config.disable,
                variant: formData.config.variant,
                category: formData.config.category,
                skills: formData.config.skills,
                temperature: formData.config.temperature,
                topP: formData.config.topP,
                prompt: formData.config.prompt,
                promptAppend: formData.config.promptAppend,
              },
            }}
            onFieldChange={handleFieldChange}
          />
        </Section>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <Section
          title="Advanced"
          description="Mode, temperature, prompts"
          defaultOpen={false}
        >
          <AdvancedSection
            config={{
              id: formData.id,
              displayName: formData.displayName,
              icon: formData.icon,
              description: formData.description,
              model: formData.model,
              fallbackModels: formData.fallbackModels,
              limits: formData.limits,
              cost: undefined,
              config: {
                mode: formData.config.mode,
                tools: formData.config.tools,
                permissions: formData.config.permissions,
                color: formData.config.color,
                disable: formData.config.disable,
                variant: formData.config.variant,
                category: formData.config.category,
                skills: formData.config.skills,
                temperature: formData.config.temperature,
                topP: formData.config.topP,
                prompt: formData.config.prompt,
                promptAppend: formData.config.promptAppend,
              },
            }}
            onConfigFieldChange={handleConfigFieldChange}
          />
        </Section>
      </Card>

      {/* Tools & Skills */}
      <Card>
        <Section
          title="Tools & Skills"
          description="Configure enabled tools and agent skills"
          defaultOpen={false}
        >
          <ToolsSection
            config={{
              id: formData.id,
              displayName: formData.displayName,
              icon: formData.icon,
              description: formData.description,
              model: formData.model,
              fallbackModels: formData.fallbackModels,
              limits: formData.limits,
              cost: undefined,
              config: {
                mode: formData.config.mode,
                tools: formData.config.tools,
                permissions: formData.config.permissions,
                color: formData.config.color,
                disable: formData.config.disable,
                variant: formData.config.variant,
                category: formData.config.category,
                skills: formData.config.skills,
                temperature: formData.config.temperature,
                topP: formData.config.topP,
                prompt: formData.config.prompt,
                promptAppend: formData.config.promptAppend,
              },
            }}
            onConfigFieldChange={handleConfigFieldChange}
          />
        </Section>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back to Agents
        </Button>
        <Button onClick={onSave} disabled={saving || (!isNew && !isDirty)}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin me-2" />
              Saving...
            </>
          ) : isNew ? (
            "Create Agent"
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
