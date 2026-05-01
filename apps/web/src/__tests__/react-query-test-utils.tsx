import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderResult, render } from "@testing-library/react";
import { FilterProvider } from "@/contexts/filter-context";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

export function renderWithQueryClient(ui: ReactElement): RenderResult {
  const queryClient = createTestQueryClient();

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <FilterProvider>{ui}</FilterProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
