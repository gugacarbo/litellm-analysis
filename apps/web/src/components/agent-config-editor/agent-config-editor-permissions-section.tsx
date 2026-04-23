import { ChevronDown, ChevronRight } from 'lucide-react';
import type { AgentConfig } from '../../types/agent-routing';
import { Button } from '../button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../collapsible';
import { Label } from '../label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';

type Props = {
  config: AgentConfig;
  expanded: boolean;
  onToggle: () => void;
  onUpdateConfig: (
    field: keyof AgentConfig,
    value: AgentConfig[keyof AgentConfig],
  ) => void;
};

type PermissionValue = 'ask' | 'allow' | 'deny';

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
  expanded,
  onToggle,
  onUpdateConfig,
}: Props) {
  const perm = config.permission || {};

  function updatePerm(field: string, value: PermissionValue) {
    onUpdateConfig('permission', { ...perm, [field]: value });
  }

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <h3 className="font-semibold">Permissions</h3>
      </div>
      <CollapsibleContent className="mt-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PermissionField
            label="Edit"
            id="perm-edit"
            value={perm.edit || 'ask'}
            onChange={(v) => updatePerm('edit', v)}
          />
          <PermissionField
            label="Bash"
            id="perm-bash"
            value={typeof perm.bash === 'string' ? perm.bash : 'ask'}
            onChange={(v) => updatePerm('bash', v)}
          />
          <PermissionField
            label="Webfetch"
            id="perm-webfetch"
            value={perm.webfetch || 'ask'}
            onChange={(v) => updatePerm('webfetch', v)}
          />
          <PermissionField
            label="Doom Loop"
            id="perm-doom_loop"
            value={perm.doom_loop || 'ask'}
            onChange={(v) => updatePerm('doom_loop', v)}
          />
          <PermissionField
            label="External Directory"
            id="perm-external_directory"
            value={perm.external_directory || 'ask'}
            onChange={(v) => updatePerm('external_directory', v)}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
