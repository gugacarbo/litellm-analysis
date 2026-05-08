import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/error-boundary";
import { Sidebar } from "./components/layout/sidebar";
import { FilterProvider } from "./contexts/filter-context";
import { AgentCatalogPage } from "./pages/agent-catalog";
import { AgentRoutingPage } from "./pages/agent-routing";
import { AliasesPage } from "./pages/aliases";
import { DashboardPage } from "./pages/dashboard";
import { LogsPage } from "./pages/logs";
import { ModelDetailPage } from "./pages/model-detail";
import { ModelStatsPage } from "./pages/model-stats";
import { ModelsPage } from "./pages/models";
import { MonitorPage } from "./pages/monitor";
import { PluginRoutingPage } from "./pages/plugin-routing";

function App() {
  return (
    <BrowserRouter>
      <FilterProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route
                path="/logs"
                element={
                  <ErrorBoundary>
                    <LogsPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/model-stats/:modelName"
                element={
                  <ErrorBoundary>
                    <ModelDetailPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/model-stats"
                element={
                  <ErrorBoundary>
                    <ModelStatsPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/models"
                element={
                  <ErrorBoundary>
                    <ModelsPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/aliases"
                element={
                  <ErrorBoundary>
                    <AliasesPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/agent-routing"
                element={
                  <ErrorBoundary>
                    <AgentRoutingPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/agent-catalog"
                element={
                  <ErrorBoundary>
                    <AgentCatalogPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/plugin-routing"
                element={
                  <ErrorBoundary>
                    <PluginRoutingPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/monitor"
                element={
                  <ErrorBoundary>
                    <MonitorPage />
                  </ErrorBoundary>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </FilterProvider>
    </BrowserRouter>
  );
}

export default App;
