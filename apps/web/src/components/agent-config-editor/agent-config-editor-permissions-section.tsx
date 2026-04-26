import type { AgentConfig } from "../../types/agent-routing";
import { Label } from "../label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

type Props = {
  config: AgentConfig;
  onUpdateConfig: (
    field: keyof AgentConfig,
    value: AgentConfig[keyof AgentConfig],
  ) => void;
};

type PermissionValue = "ask" | "allow" | "deny";

function PermissionField({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: PermissionValue) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ask">Ask</SelectItem>
          <SelectItem value="allow">Allow</SelectItem>
          <SelectItem value="deny">Deny</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function AgentConfigEditorPermissionsSection({
  config,
  onUpdateConfig,
}: Props) {
  const perm = config.permission || {};

  function updatePerm(field: string, value: PermissionValue) {
    onUpdateConfig("permission", { ...perm, [field]: value });
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Permissions</h3>
        <p className="text-xs text-muted-foreground">
          Default behavior for edit, shell and web-related operations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PermissionField
          label="Edit"
          id="perm-edit"
          value={perm.edit || "ask"}
          onChange={(v) => updatePerm("edit", v)}
        />
        <PermissionField
          label="Bash"
          id="perm-bash"
          value={typeof perm.bash === "string" ? perm.bash : "ask"}
          onChange={(v) => updatePerm("bash", v)}
        />
        <PermissionField
          label="Webfetch"
          id="perm-webfetch"
          value={perm.webfetch || "ask"}
          onChange={(v) => updatePerm("webfetch", v)}
        />
        <PermissionField
          label="Doom Loop"
          id="perm-doom_loop"
          value={perm.doom_loop || "ask"}
          onChange={(v) => updatePerm("doom_loop", v)}
        />
        <PermissionField
          label="External Directory"
          id="perm-external_directory"
          value={perm.external_directory || "ask"}
          onChange={(v) => updatePerm("external_directory", v)}
        />
      </div>
    </section>
  );
}
