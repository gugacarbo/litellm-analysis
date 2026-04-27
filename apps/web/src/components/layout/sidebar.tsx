import {
  Activity,
  BarChart3,
  FileText,
  GitBranch,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Card, CardContent } from "../../components/card";

export function Sidebar() {
  const navItems = [
    { to: "/", icon: Activity, label: "Dashboard" },
    { to: "/models", icon: Settings, label: "Models" },
    { to: "/model-stats", icon: BarChart3, label: "Model Stats" },
    { to: "/logs", icon: FileText, label: "Spend Logs" },
    { to: "/agent-routing", icon: GitBranch, label: "Agent Routing" },
  ];

  return (
    <aside className="w-64 min-h-screen border-l bg-muted/10 p-4">
      <Card>
        <CardContent className="px-3 py-0 gap-4 flex flex-col">
          <div className="flex gap-1 flex-col">
            <h2 className="font-bold text-lg">LiteLLM Stats</h2>
          </div>
          <nav className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </CardContent>
      </Card>
    </aside>
  );
}
