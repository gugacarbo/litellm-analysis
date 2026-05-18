import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRoot } from "react-dom/client";

import "./styles/globals.css";
import { Toaster } from "@/components/ui/sonner.tsx";
import { queryClient } from "@/shared/lib/query-client";
import { ThemeProvider } from "@/shared/contexts/theme-provider";
import App from "./App.tsx";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

createRoot(rootEl).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <Toaster position="top-right" richColors closeButton duration={5000} />
      <App />
    </ThemeProvider>

    {import.meta.env.DEV && (
      <TanStackDevtools
        config={{
          position: "bottom-right",
          panelLocation: "bottom",
          defaultOpen: false,
          hideUntilHover: false,
          openHotkey: ["Shift", "D"],
        }}
        plugins={[
          {
            id: "tanstack-query",
            name: "TanStack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
        ]}
      />
    )}
  </QueryClientProvider>,
);
