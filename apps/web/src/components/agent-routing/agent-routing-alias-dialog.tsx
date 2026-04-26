import { RefreshCw } from "lucide-react";
import { Button } from "../button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { Input } from "../input";

type AgentRoutingAliasDialogProps = {
  open: boolean;
  mode: "add" | "edit";
  saving: boolean;
  aliasKey: string;
  aliasValue: string;
  onOpenChange: (open: boolean) => void;
  onAliasKeyChange: (value: string) => void;
  onAliasValueChange: (value: string) => void;
  onSave: () => void;
};

export function AgentRoutingAliasDialog({
  open,
  mode,
  saving,
  aliasKey,
  aliasValue,
  onOpenChange,
  onAliasKeyChange,
  onAliasValueChange,
  onSave,
}: AgentRoutingAliasDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Custom Alias" : "Edit Custom Alias"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === "add"
              ? "Add a new custom alias for routing."
              : "Edit an existing custom alias."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="alias-key" className="text-sm font-medium">
              Alias
            </label>
            <Input
              id="alias-key"
              value={aliasKey}
              onChange={(e) => onAliasKeyChange(e.target.value)}
              placeholder="e.g. my-model-alias"
              disabled={mode === "edit"}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="alias-value" className="text-sm font-medium">
              Routes To
            </label>
            <Input
              id="alias-value"
              value={aliasValue}
              onChange={(e) => onAliasValueChange(e.target.value)}
              placeholder="e.g. gpt-4"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || !aliasKey.trim() || !aliasValue.trim()}
          >
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
