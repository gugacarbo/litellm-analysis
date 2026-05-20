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
import { LogDetailPage } from "@/features/logs/detail";
import { LogsPage } from "@/features/logs";
import { ModelStatsPage } from "@/features/model-stats/index";
import { ModelDetailPage } from "@/features/models/detail-index";
import { ModelConfigPage } from "@/features/models/index";
import { ModelsPage } from "@/features/models/list-index";
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

export const routes: RouteConfig[] = [
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
    path: "/models",
    title: "Models",
    component: ModelsPage,
    withErrorBoundary: true,
  },
  {
    path: "/models/:modelName",
    title: "Model Configuration",
    component: ModelConfigPage,
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
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
