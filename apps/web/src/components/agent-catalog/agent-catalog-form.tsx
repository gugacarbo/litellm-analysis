import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import type { AgentCatalogFormProps } from "./agent-catalog-types";

export function AgentCatalogForm({
  agent,
  open,
  onOpenChange,
  onSubmit,
}: AgentCatalogFormProps) {
  const isEditing = Boolean(agent);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const displayName = (formData.get("displayName") as string) || "";
    const icon = (formData.get("icon") as string) || "";
    const description = (formData.get("description") as string) || "";
    const model = (formData.get("model") as string) || "";
    const fallbackRaw = (formData.get("fallbackModels") as string) || "";
    const fallbackModels = fallbackRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const mode = (formData.get("mode") as string) || undefined;
    const color = (formData.get("color") as string) || undefined;

    onSubmit({
      displayName,
      icon,
      description,
      model,
      fallbackModels,
      mode: mode || undefined,
      color: color || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Agent" : "Create Agent"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? agent
                ? `Update configuration for ${agent.displayName}`
                : ""
              : "Configure a new agent in the catalog"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={agent?.displayName ?? ""}
                placeholder="e.g., Code Assistant"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="icon">Icon</Label>
              <Input
                id="icon"
                name="icon"
                defaultValue={agent?.icon ?? ""}
                placeholder="e.g., 🤖"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={agent?.description ?? ""}
                placeholder="Describe what this agent does"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                name="model"
                defaultValue={agent?.model ?? ""}
                placeholder="e.g., gpt-4o"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fallbackModels">
                Fallback Models
                <span className="text-muted-foreground font-normal ml-1">
                  (comma-separated)
                </span>
              </Label>
              <Input
                id="fallbackModels"
                name="fallbackModels"
                defaultValue={agent?.fallbackModels.join(", ") ?? ""}
                placeholder="e.g., gpt-3.5-turbo, claude-sonnet"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mode">Mode</Label>
              <Select name="mode" defaultValue={agent?.mode ?? "all"}>
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="subagent">Subagent</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">
                Color
                <span className="text-muted-foreground font-normal ml-1">
                  (hex)
                </span>
              </Label>
              <Input
                id="color"
                name="color"
                defaultValue={agent?.color ?? ""}
                placeholder="e.g., #6366f1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
