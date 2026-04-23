import { Card, CardContent } from '../../components/card';
import { Activity, AlertCircle, BarChart3, FileText, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useServerMode } from '../../hooks/use-server-mode';
import { Badge } from '../../components/badge';



export function Sidebar() {
  const { mode, capabilities, isLoading } = useServerMode();
  
  const navItems = [
    { to: '/', icon: Activity, label: 'Dashboard' },
    { to: '/model-stats', icon: BarChart3, label: 'Model Stats' },
    { to: '/logs', icon: FileText, label: 'Spend Logs' },
    ...(capabilities.errorLogs ? [{ to: '/errors', icon: AlertCircle, label: 'Errors' }] : []),
    { to: '/models', icon: Settings, label: 'Models' },
  ];

  return (
    <aside className="w-64 min-h-screen border-l bg-muted/10 p-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">LiteLLM Stats</h2>
            {!isLoading ? (
              <Badge className={mode === 'limited' ? 'bg-amber-500/15 text-amber-600 border-amber-500/30' : ''} variant={mode === 'database' ? 'default' : 'secondary'}>
                {mode === 'database' ? '🟢 Full Access' : mode === 'limited' ? '🟠 Limited' : '🟡 API Mode'}
              </Badge>
            ) : (
              <Badge variant="outline">Loading...</Badge>
            )}
          </div>
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
