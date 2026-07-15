import type { ComponentType } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AgentsPage } from "@/features/agents/list-index";
import { BenchmarksPage } from "@/features/benchmarks";
import { BenchmarksLayout } from "@/features/benchmarks/benchmarks-layout";
import { DashboardPage } from "@/features/dashboard";
import { LogsPage } from "@/features/logs";
import { LogChatSimulationPage } from "@/features/logs/chat-simulation";
import { LogDetailPage } from "@/features/logs/detail";
import { ModelStatsPage } from "@/features/model-stats/index";
import { ModelsConfiguredPage } from "@/features/models/models-configured-page";
import { ModelsHealthCheckPage } from "@/features/models/models-health-check-page";
import { ModelsLayout } from "@/features/models/models-layout";
import { ProvidersPage } from "@/features/models/providers-page";
import { OpenRouterBenchmarksPage } from "@/features/openrouter-benchmarks";
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
    path: "/model-stats",
    title: "Model Statistics",
    component: ModelStatsPage,
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
    title: "Agents",
    component: AgentsPage,
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
              path: "providers",
              element: (
                <ErrorBoundary>
                  <ProvidersPage />
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
          ],
        },
        {
          path: "benchmarks",
          element: (
            <ErrorBoundary>
              <BenchmarksLayout />
            </ErrorBoundary>
          ),
          children: [
            {
              index: true,
              element: <Navigate to="aa" replace />,
            },
            {
              path: "aa",
              element: (
                <ErrorBoundary>
                  <BenchmarksPage />
                </ErrorBoundary>
              ),
            },
            {
              path: "openrouter",
              element: (
                <ErrorBoundary>
                  <OpenRouterBenchmarksPage />
                </ErrorBoundary>
              ),
            },
          ],
        },
        {
          path: "/model-stats/:modelName",
          element: <Navigate to="/models/:modelName" replace />,
        },
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
