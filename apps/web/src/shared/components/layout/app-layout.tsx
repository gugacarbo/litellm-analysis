import { matchPath, Outlet, useLocation } from "react-router-dom";
import { FloatingChatWidget } from "@/features/floating-chat/floating-chat-widget";
import { DateRangeFilter } from "@/shared/components/ui/date-range-filter";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/components/ui/sidebar";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { FilterProvider } from "@/shared/contexts/filter-context";
import { AppSidebar } from "./sidebar";

export function AppLayout() {
  const location = useLocation();
  const modelDetailMatch = matchPath(
    "/models/:modelName/:tab",
    location.pathname,
  );
  const activeModelName = modelDetailMatch?.params.modelName ?? null;
  const activeModelTab = modelDetailMatch?.params.tab ?? null;
  const shouldShowDateRangeFilter =
    activeModelTab === "overview" ||
    activeModelTab === "logs" ||
    (!modelDetailMatch && location.pathname !== "/benchmarks");

  return (
    <TooltipProvider>
      <FilterProvider>
        <SidebarProvider>
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-3">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger />
                {activeModelName ? (
                  <span className="truncate text-sm font-medium">
                    {activeModelName}
                  </span>
                ) : null}
              </div>
              {shouldShowDateRangeFilter ? (
                <DateRangeFilter />
              ) : (
                <div aria-hidden="true" />
              )}
            </div>
            <SidebarInset className="min-h-0 min-w-0 overflow-x-hidden">
              <Outlet />
              <FloatingChatWidget />
            </SidebarInset>
          </div>
        </SidebarProvider>
      </FilterProvider>
    </TooltipProvider>
  );
}
