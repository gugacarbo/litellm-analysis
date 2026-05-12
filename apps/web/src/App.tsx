import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/error-boundary";
import { Sidebar } from "./components/layout/sidebar";
import { FilterProvider } from "./contexts/filter-context";
import { AgentsPage } from "./pages/agents";
import { BenchmarksPage } from "./pages/benchmarks";
import { DashboardPage } from "./pages/dashboard";
import { LogsPage } from "./pages/logs";
import { ModelDetailPage } from "./pages/model-detail";
import { ModelStatsPage } from "./pages/model-stats";
import { ModelsPage } from "./pages/models";
import { MonitorPage } from "./pages/monitor";
import { PluginConfigPage } from "./pages/plugin-config";
import { PluginsPage } from "./pages/plugins";
import { PromptEvalDetailPage } from "./pages/prompt-eval-detail";
import { PromptEvalsPage } from "./pages/prompt-evals";

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
                path="/benchmarks"
                element={
                  <ErrorBoundary>
                    <BenchmarksPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/agents"
                element={
                  <ErrorBoundary>
                    <AgentsPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/plugins"
                element={
                  <ErrorBoundary>
                    <PluginsPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/plugins/:pluginId"
                element={
                  <ErrorBoundary>
                    <PluginConfigPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/prompt-evals"
                element={
                  <ErrorBoundary>
                    <PromptEvalsPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/prompt-evals/:id"
                element={
                  <ErrorBoundary>
                    <PromptEvalDetailPage />
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
