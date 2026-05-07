import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/error-boundary";
import { Sidebar } from "./components/layout/sidebar";
import { FilterProvider } from "./contexts/filter-context";
import { AgentRoutingPage } from "./pages/agent-routing";
import { AliasesPage } from "./pages/aliases";
import { DashboardPage } from "./pages/dashboard";
import { LogsPage } from "./pages/logs";
import { ModelDetailPage } from "./pages/model-detail";
import { ModelStatsPage } from "./pages/model-stats";
import { ModelsPage } from "./pages/models";
import { MonitorPage } from "./pages/monitor";

function App() {
  return _jsx(BrowserRouter, {
    children: _jsx(FilterProvider, {
      children: _jsxs("div", {
        className: "flex min-h-screen",
        children: [
          _jsx(Sidebar, {}),
          _jsx("main", {
            className: "flex-1 overflow-auto",
            children: _jsxs(Routes, {
              children: [
                _jsx(Route, { path: "/", element: _jsx(DashboardPage, {}) }),
                _jsx(Route, {
                  path: "/logs",
                  element: _jsx(ErrorBoundary, {
                    children: _jsx(LogsPage, {}),
                  }),
                }),
                _jsx(Route, {
                  path: "/model-stats/:modelName",
                  element: _jsx(ErrorBoundary, {
                    children: _jsx(ModelDetailPage, {}),
                  }),
                }),
                _jsx(Route, {
                  path: "/model-stats",
                  element: _jsx(ErrorBoundary, {
                    children: _jsx(ModelStatsPage, {}),
                  }),
                }),
                _jsx(Route, {
                  path: "/models",
                  element: _jsx(ErrorBoundary, {
                    children: _jsx(ModelsPage, {}),
                  }),
                }),
                _jsx(Route, {
                  path: "/aliases",
                  element: _jsx(ErrorBoundary, {
                    children: _jsx(AliasesPage, {}),
                  }),
                }),
                _jsx(Route, {
                  path: "/agent-routing",
                  element: _jsx(ErrorBoundary, {
                    children: _jsx(AgentRoutingPage, {}),
                  }),
                }),
                _jsx(Route, {
                  path: "/monitor",
                  element: _jsx(ErrorBoundary, {
                    children: _jsx(MonitorPage, {}),
                  }),
                }),
                _jsx(Route, {
                  path: "*",
                  element: _jsx(Navigate, { to: "/", replace: true }),
                }),
              ],
            }),
          }),
        ],
      }),
    }),
  });
}
export default App;
