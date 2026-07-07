import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Scale } from "lucide-react";
import { PageLayout } from "@/shared/components/ui/page-layout";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

const TABS = [
  {
    value: "aa",
    label: "Artificial Analysis",
    to: "/benchmarks/aa",
    icon: Scale,
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    to: "/benchmarks/openrouter",
    icon: Globe,
  },
] as const;

export function BenchmarksLayout() {
  const location = useLocation();
  const activeTab = location.pathname.startsWith("/benchmarks/openrouter")
    ? "openrouter"
    : "aa";

  return (
    <PageLayout>
      <Tabs value={activeTab} className="space-y-4">
        <TabsList variant="line">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <NavLink to={tab.to}>
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </NavLink>
            </TabsTrigger>
          ))}
        </TabsList>
        <Outlet />
      </Tabs>
    </PageLayout>
  );
}
