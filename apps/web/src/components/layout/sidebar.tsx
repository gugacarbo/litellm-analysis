import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileText,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Card, CardContent } from "../../components/card";

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

export function Sidebar() {
  const [modelsExpanded, setModelsExpanded] = useState(true);

  const navItems: NavItem[] = [
    { to: "/", icon: Activity, label: "Dashboard" },
    {
      id: "models",
      icon: Settings,
      label: "Models",
      children: [
        { to: "/model-stats", label: "Stats" },
        { to: "/aliases", label: "Aliases" },
        { to: "/models", label: "Config" },
      ],
    },
    { to: "/logs", icon: FileText, label: "Logs" },
    { to: "/agent-routing", icon: BarChart3, label: "Agent Routing" },
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
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => setModelsExpanded(!modelsExpanded)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors w-full text-left ${
                        modelsExpanded ? "bg-muted" : "hover:bg-muted"
                      }`}
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span className="flex-1">{item.label}</span>
                      {modelsExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {modelsExpanded && (
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
