import {
  Activity,
  Bot,
  ChevronDown,
  ChevronRight,
  Cpu,
  FileText,
  GitBranch,
  Radar,
  Scale,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Card, CardContent } from "../ui/card";

interface NavLeaf {
  id?: string;
  to: string;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
}

interface NavBranch {
  id: string;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: NavLeaf[];
}

type NavItem = NavLeaf | NavBranch;

function isBranch(item: NavItem): item is NavBranch {
  return "children" in item;
}

function getExpandedState(
  id: string,
  monitoringExpanded: boolean,
  agentsExpanded: boolean,
): boolean {
  if (id === "monitoring") return monitoringExpanded;
  if (id === "agents") return agentsExpanded;
  return false;
}

function toggleExpanded(
  id: string,
  setMonitoring: (v: boolean) => void,
  setAgents: (v: boolean) => void,
  currentMonitoring: boolean,
  currentAgents: boolean,
): void {
  if (id === "monitoring") setMonitoring(!currentMonitoring);
  if (id === "agents") setAgents(!currentAgents);
}

export function Sidebar() {
  const [monitoringExpanded, setMonitoringExpanded] = useState(false);
  const [agentsExpanded, setAgentsExpanded] = useState(true);

  const navItems: NavItem[] = [
    { to: "/", icon: Activity, label: "Dashboard" },
    { to: "/monitor", icon: Radar, label: "Monitor" },
    { to: "/model-stats", icon: TrendingUp, label: "Stats" },
    { to: "/logs", icon: FileText, label: "Logs" },
    { to: "/benchmarks", icon: Scale, label: "Benchmarks" },
    {
      id: "agents",
      icon: Bot,
      label: "Agents",
      children: [
        { to: "/agents", label: "Config", icon: Settings },
        { to: "/plugins", label: "Plugins + Routing", icon: GitBranch },
        { to: "/prompt-evals", label: "Evals" },
      ],
    },
    { to: "/models", icon: Cpu, label: "Models" },
  ];

  return (
    <aside className="w-64 min-h-screen border-l bg-muted/10 p-4">
      <Card>
        <CardContent className="px-3 py-0 gap-4 flex flex-col">
          <div className="flex gap-1 flex-col">
            <h2 className="font-bold text-lg">LiteLLM Stats</h2>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              if (isBranch(item)) {
                const expanded = getExpandedState(
                  item.id,
                  monitoringExpanded,
                  agentsExpanded,
                );
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        toggleExpanded(
                          item.id,
                          setMonitoringExpanded,
                          setAgentsExpanded,
                          monitoringExpanded,
                          agentsExpanded,
                        )
                      }
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors w-full text-left ${
                        expanded ? "bg-muted" : "hover:bg-muted"
                      }`}
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span className="flex-1">{item.label}</span>
                      {expanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            className={({ isActive }) =>
                              `flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              }`
                            }
                          >
                            {child.icon && <child.icon className="h-4 w-4" />}
                            <span>{child.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`
                  }
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </CardContent>
      </Card>
    </aside>
  );
}
