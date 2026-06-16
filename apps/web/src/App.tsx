import type { ComponentType } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AgentConfigPage } from "@/features/agents";
import { AgentsPage } from "@/features/agents/list-index";
import { BenchmarksPage } from "@/features/benchmarks";
import { DashboardPage } from "@/features/dashboard";
import { LogsPage } from "@/features/logs";
import { LogChatSimulationPage } from "@/features/logs/chat-simulation";
import { LogDetailPage } from "@/features/logs/detail";
import { ModelStatsPage } from "@/features/model-stats/index";
import { ModelDetailPage } from "@/features/models/detail-index";
import { ModelConfigPage } from "@/features/models/index";
import { ModelsConfiguredPage } from "@/features/models/models-configured-page";
import { ModelsHealthCheckPage } from "@/features/models/models-health-check-page";
import { ModelsLayout } from "@/features/models/models-layout";
import { MonitorPage } from "@/features/monitor";
import { PluginConfigPage } from "@/features/plugins";
import { PluginsPage } from "@/features/plugins/list-index";
import { PromptEvalDetailPage } from "@/features/prompts/detail";
import { PromptEvalsPage } from "@/features/prompts/list-index";
import { ErrorBoundary } from "@/shared/components/error-boundary";
import { AppLayout } from "@/shared/components/layout/app-layout";

interface RouteConfig {
  path: string;
  title: string;
  component: ComponentType;
  withErrorBoundary?: boolean;
}

const routes: RouteConfig[] = [
  { path: "/", title: "Dashboard", component: DashboardPage },
  {
    path: "/logs",
    title: "Logs",
    component: LogsPage,
    withErrorBoundary: true,
  },
  {
    path: "/logs/:requestId",
    title: "Log Detail",
    component: LogDetailPage,
    withErrorBoundary: true,
  },
  {
    path: "/logs/:requestId/chat",
    title: "Chat Simulation",
    component: LogChatSimulationPage,
    withErrorBoundary: true,
  },
  {
    path: "/model-stats/:modelName",
    title: "Model Detail",
    component: ModelDetailPage,
    withErrorBoundary: true,
  },
  {
    path: "/model-stats",
    title: "Model Statistics",
    component: ModelStatsPage,
    withErrorBoundary: true,
  },
  {
    path: "/benchmarks",
    title: "Benchmarks",
    component: BenchmarksPage,
    withErrorBoundary: true,
  },
  {
    path: "/agents",
    title: "Agents",
    component: AgentsPage,
    withErrorBoundary: true,
  },
  {
    path: "/agents/:id",
    title: "Agent Configuration",
    component: AgentConfigPage,
    withErrorBoundary: true,
  },
  {
    path: "/plugins",
    title: "Plugins",
    component: PluginsPage,
    withErrorBoundary: true,
  },
  {
    path: "/plugins/:pluginId",
    title: "Plugin Configuration",
    component: PluginConfigPage,
    withErrorBoundary: true,
  },
  {
    path: "/prompt-evals",
    title: "Prompt Evaluations",
    component: PromptEvalsPage,
    withErrorBoundary: true,
  },
  {
    path: "/prompt-evals/:id",
    title: "Prompt Evaluation Detail",
    component: PromptEvalDetailPage,
    withErrorBoundary: true,
  },
  {
    path: "/monitor",
    title: "Monitor",
    component: MonitorPage,
    withErrorBoundary: true,
  },
];

function renderRoute(config: RouteConfig) {
  const { component: Component, withErrorBoundary, ...rest } = config;

  const element = withErrorBoundary ? (
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  ) : (
    <Component />
  );

  return { ...rest, element };
}

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <AppLayout />,
      children: [
        ...routes.map(renderRoute),
        {
          path: "models",
          element: (
            <ErrorBoundary>
              <ModelsLayout />
            </ErrorBoundary>
          ),
          children: [
            {
              index: true,
              element: <Navigate to="configured" replace />,
            },
            {
              path: "configured",
              element: (
                <ErrorBoundary>
                  <ModelsConfiguredPage />
                </ErrorBoundary>
              ),
            },
            {
              path: "health-check",
              element: (
                <ErrorBoundary>
                  <ModelsHealthCheckPage />
                </ErrorBoundary>
              ),
            },
            {
              path: ":modelName",
              element: (
                <ErrorBoundary>
                  <ModelConfigPage />
                </ErrorBoundary>
              ),
            },
          ],
        },
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
