import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";

interface CategoryOption {
  value: string;
  label: string;
}

interface SystemAgentOption {
  key: string;
  displayName: string;
}

interface LitellmAliasRoutingTableProps {
  systemAgents: SystemAgentOption[];
  categoryOptions: CategoryOption[];
  agentMappings: Record<string, string>;
  categoryMappings: Record<string, boolean>;
  configValues: Record<string, unknown>;
  onAgentMappingChange: (agentKey: string, systemAgentKey: string) => void;
  onCategoryToggle: (categoryId: string) => void;
}

export function LitellmAliasRoutingTable({
  systemAgents,
  categoryOptions,
  agentMappings,
  categoryMappings,
  configValues,
  onAgentMappingChange,
  onCategoryToggle,
}: LitellmAliasRoutingTableProps) {
  if (systemAgents.length === 0 && categoryOptions.length === 0) return null;

  const includeAgents = configValues.includeAgents !== false;
  const includeCategories = configValues.includeCategories !== false;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Alias Routing</h3>
      <p className="text-sm text-muted-foreground">
        Enable or disable catalog agents and categories for this plugin.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Enabled</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {systemAgents.length > 0 && (
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableCell colSpan={3} className="py-2">
                <span className="text-sm font-medium">Agents</span>
                {!includeAgents && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (disabled)
                  </span>
                )}
              </TableCell>
            </TableRow>
          )}
          {systemAgents.map((agent) => (
            <TableRow
              key={agent.key}
              className={cn(!includeAgents && "opacity-50")}
            >
              <TableCell className="font-medium">
                {agent.displayName}
              </TableCell>
              <TableCell>
                <Badge>Agent</Badge>
              </TableCell>
              <TableCell>
                <Switch
                  checked={!!agentMappings[agent.key]}
                  disabled={!includeAgents}
                  onCheckedChange={(checked) => {
                    onAgentMappingChange(
                      agent.key,
                      checked ? agent.key : "",
                    );
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
          {categoryOptions.length > 0 && (
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableCell colSpan={3} className="py-2">
                <span className="text-sm font-medium">Categories</span>
                {!includeCategories && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (disabled)
                  </span>
                )}
              </TableCell>
            </TableRow>
          )}
          {categoryOptions.map((cat) => (
            <TableRow
              key={cat.value}
              className={cn(!includeCategories && "opacity-50")}
            >
              <TableCell className="font-medium">{cat.label}</TableCell>
              <TableCell>
                <Badge variant="secondary">Category</Badge>
              </TableCell>
              <TableCell>
                <Switch
                  checked={categoryMappings[cat.value] ?? false}
                  disabled={!includeCategories}
                  onCheckedChange={() => onCategoryToggle(cat.value)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
