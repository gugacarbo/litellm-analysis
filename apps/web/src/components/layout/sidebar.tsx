import { Card, CardContent } from '../../components/card';
import { Activity, AlertCircle, BarChart3, FileText, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: Activity, label: 'Dashboard' },
  { to: '/model-stats', icon: BarChart3, label: 'Model Stats' },
  { to: '/logs', icon: FileText, label: 'Spend Logs' },
  { to: '/errors', icon: AlertCircle, label: 'Errors' },
  { to: '/models', icon: Settings, label: 'Models' },
];

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen border-l bg-muted/10 p-4">
      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold text-lg mb-4">LiteLLM Stats</h2>
          <nav className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
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
