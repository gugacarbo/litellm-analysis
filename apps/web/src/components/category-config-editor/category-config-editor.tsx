import type { CategoryEntry } from "@lite-llm/contracts/category";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { AdvancedSection } from "./advanced-section";
import { GeneralSection } from "./general-section";
import { normalizeCategoryEntry } from "./normalize";

interface CategoryConfigEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryKey: string | null;
  category: CategoryEntry | null;
  onSave: (key: string, category: CategoryEntry) => Promise<void>;
  saving?: boolean;
  isNew?: boolean;
}

const DEFAULT_SECTIONS: Record<string, boolean> = {
  thinking: false,
  reasoning: false,
  flags: false,
  prompt: false,
  tools: false,
};

export function CategoryConfigEditor({
  open,
  onOpenChange,
  categoryKey,
  category,
  onSave,
  saving = false,
  isNew = false,
}: CategoryConfigEditorProps) {
  const [key, setKey] = useState<string>("");
  const [config, setConfig] = useState<CategoryEntry>(() =>
    normalizeCategoryEntry(category ?? {}),
  );
  const [expandedSections, setExpandedSections] =
    useState<Record<string, boolean>>(DEFAULT_SECTIONS);

  useEffect(() => {
    if (open) {
      if (categoryKey) {
        setKey(categoryKey);
      }
      if (category) {
        setConfig(normalizeCategoryEntry(category));
      } else {
        setConfig(normalizeCategoryEntry({}));
      }
      setExpandedSections(DEFAULT_SECTIONS);
    }
  }, [open, categoryKey, category]);

  const updateField = <K extends keyof CategoryEntry>(
    field: K,
    value: CategoryEntry[K],
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSave = async () => {
    const saveKey = isNew ? key : categoryKey;
    if (!saveKey) return;
    await onSave(saveKey, config);
  };

  const canSave = isNew ? key.trim().length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Create Category" : `Edit Category: ${categoryKey}`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isNew
              ? "Create a new category configuration"
              : `Edit configuration for ${categoryKey}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <GeneralSection
            categoryKey={key}
            category={config}
            onKeyChange={setKey}
            onUpdate={updateField}
            isNew={isNew}
          />

          <AdvancedSection
            category={config}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            onUpdate={updateField}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin me-2" />
                Saving...
              </>
            ) : isNew ? (
              "Create"
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
