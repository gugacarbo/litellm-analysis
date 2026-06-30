import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { FilterProvider } from "@/shared/contexts/filter-context";

export function renderWithQueryClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <MemoryRouter>
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </TooltipProvider>
    </MemoryRouter>,
  );
}

export function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <MemoryRouter>
      <FilterProvider>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </FilterProvider>
    </MemoryRouter>,
  );
}
