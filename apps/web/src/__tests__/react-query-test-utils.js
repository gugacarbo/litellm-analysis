import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { jsx as _jsx } from "react/jsx-runtime";
import { MemoryRouter } from "react-router-dom";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}
export function renderWithQueryClient(ui) {
  const queryClient = createTestQueryClient();
  return render(
    _jsx(MemoryRouter, {
      children: _jsx(QueryClientProvider, {
        client: queryClient,
        children: ui,
      }),
    }),
  );
}
