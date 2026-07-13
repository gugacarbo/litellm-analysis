import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  ScriptOnce,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { getUiPreferences } from "@/features/ui-preferences/server/ui-preferences.functions";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import appCss from "@/styles.css?url";

export const PRE_PAINT_THEME_SCRIPT = `(()=>{const c=document.cookie.match(/(?:^|;\\s*)ui_theme=([^;]*)/);let t=c?.[1];if(t!=="light"&&t!=="dark"){t=window.matchMedia?.("(prefers-color-scheme: dark)").matches?"dark":"light";document.cookie="ui_theme="+t+"; Path=/; SameSite=Lax; Max-Age=15552000"}document.documentElement.classList.remove("light","dark");document.documentElement.classList.add(t)})();`;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const Route = createRootRoute({
  loader: () => getUiPreferences({ data: {} }),
  notFoundComponent: NotFoundPage,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "AgentLens",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/agentlens-mark.svg",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function NotFoundPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link to="/" className="text-primary hover:underline">
        Go home
      </Link>
    </main>
  );
}

function RootDocument() {
  const preferences = Route.useLoaderData();

  return (
    <html className={preferences.theme} lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <ScriptOnce>{PRE_PAINT_THEME_SCRIPT}</ScriptOnce>
      <body>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <Outlet />
          </QueryClientProvider>
        </TooltipProvider>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
