import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdvancedSection } from "./agent-config-editor/advanced-section";
import { GeneralSection } from "./agent-config-editor/general-section";
import { ModelSection } from "./agent-config-editor/model-section";
import { normalizeSystemAgent } from "./agent-config-editor/normalize";
import { ToolsSection } from "./agent-config-editor/tools-section";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface AgentConfigEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: SystemAgent | null;
  onSave: (agent: SystemAgent) => Promise<void>;
  saving?: boolean;
}

export function AgentConfigEditor({
  open,
  onOpenChange,
  agent,
  onSave,
  saving = false,
}: AgentConfigEditorProps) {
  const [config, setConfig] = useState<SystemAgent>(() =>
    normalizeSystemAgent(agent ?? {}),
  );

  useEffect(() => {
    if (agent) {
      setConfig(normalizeSystemAgent(agent));
    }
  }, [agent]);

  const updateField = useCallback((field: string, value: unknown) => {
    setConfig((prev) => {
      if (field === "config") {
        return { ...prev, config: { ...prev.config, ...(value as object) } };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const updateConfigField = useCallback((field: string, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      config: { ...prev.config, [field]: value },
    }));
  }, []);

  const handleSave = async () => {
    await onSave(config);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Edit Agent: {config.displayName || "Unknown"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit configuration for {config.displayName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 overflow-hidden">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="tools">Tools & Skills</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="general" className="mt-0">
              <GeneralSection config={config} onFieldChange={updateField} />
            </TabsContent>

            <TabsContent value="model" className="mt-0">
              <ModelSection config={config} onFieldChange={updateField} />
            </TabsContent>

            <TabsContent value="tools" className="mt-0">
              <ToolsSection
                config={config}
                onConfigFieldChange={updateConfigField}
              />
            </TabsContent>

            <TabsContent value="advanced" className="mt-0">
              <AdvancedSection
                config={config}
                onConfigFieldChange={updateConfigField}
              />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin me-2" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
