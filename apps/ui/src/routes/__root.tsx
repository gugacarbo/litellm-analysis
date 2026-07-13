import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { getUiPreferences } from "../server/ui-preferences.functions";
import appCss from "../styles.css?url";

export const PREPAINT_THEME_SCRIPT = `(()=>{const c=document.cookie.match(/(?:^|;\\s*)ui_theme=([^;]*)/);let t=c?.[1];if(t!=="light"&&t!=="dark"){t=window.matchMedia?.("(prefers-color-scheme: dark)").matches?"dark":"light";document.cookie="ui_theme="+t+"; Path=/; SameSite=Lax; Max-Age=15552000"}document.documentElement.classList.remove("light","dark");document.documentElement.classList.add(t)})();`;

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
        title: "LiteLLM Analytics",
      },
    ],
    links: [
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
      <Link to="/" className="text-indigo-600 hover:underline">
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
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: This is a static, source-controlled pre-paint script that contains no user data. */}
        <script dangerouslySetInnerHTML={{ __html: PREPAINT_THEME_SCRIPT }} />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <Outlet />
        </QueryClientProvider>
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
