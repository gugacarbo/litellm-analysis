import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { FilterProvider } from "./contexts/filter-context";
import { Sidebar } from "./components/layout/sidebar";
import { AgentRoutingPage } from "./pages/agent-routing";
import { AliasesPage } from "./pages/aliases";
import { DashboardPage } from "./pages/dashboard";
import { LogsPage } from "./pages/logs";
import { ModelDetailPage } from "./pages/model-detail";
import { ModelStatsPage } from "./pages/model-stats";
import { ModelsPage } from "./pages/models";
import { MonitorPage } from "./pages/monitor";

function App() {
  return (
    <BrowserRouter>
      <FilterProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route
              path="/model-stats/:modelName"
              element={<ModelDetailPage />}
            />
            <Route path="/model-stats" element={<ModelStatsPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/aliases" element={<AliasesPage />} />
            <Route path="/agent-routing" element={<AgentRoutingPage />} />
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      </FilterProvider>
    </BrowserRouter>
  );
}

export default App;
