import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import { queryClient } from "@/lib/query-client";
import App from "./App.tsx";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");
createRoot(rootEl).render(
  _jsxs(QueryClientProvider, {
    client: queryClient,
    children: [
      _jsxs(ThemeProvider, {
        children: [
          _jsx(Toaster, {
            position: "top-right",
            richColors: true,
            closeButton: true,
            duration: 5000,
          }),
          _jsx(App, {}),
        ],
      }),
      import.meta.env.DEV &&
        _jsx(TanStackDevtools, {
          config: {
            position: "bottom-right",
            panelLocation: "bottom",
            defaultOpen: false,
            hideUntilHover: false,
            openHotkey: ["Shift", "D"],
          },
          plugins: [
            {
              id: "tanstack-query",
              name: "TanStack Query",
              render: _jsx(ReactQueryDevtoolsPanel, {}),
            },
          ],
        }),
    ],
  }),
);
