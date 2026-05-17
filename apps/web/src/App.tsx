import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "./components/error-boundary";
import { AppSidebar } from "./components/layout/sidebar";
import { FilterProvider } from "./contexts/filter-context";
import { AgentConfigPage } from "./pages/agent-config";
import { AgentsPage } from "./pages/agents";
import { BenchmarksPage } from "./pages/benchmarks";
import { DashboardPage } from "./pages/dashboard";
import { LogsPage } from "./pages/logs";
import { ModelConfigPage } from "./pages/model-config";
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
      <TooltipProvider>
        <FilterProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger />
              </header>
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
                    path="/models/:modelName"
                    element={
                      <ErrorBoundary>
                        <ModelConfigPage />
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
                    path="/agents/:id"
                    element={
                      <ErrorBoundary>
                        <AgentConfigPage />
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
            </SidebarInset>
          </SidebarProvider>
        </FilterProvider>
      </TooltipProvider>
    </BrowserRouter>
  );
}

export default App;
