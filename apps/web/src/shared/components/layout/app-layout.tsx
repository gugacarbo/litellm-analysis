import { Outlet } from "react-router-dom";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FilterProvider } from "@/shared/contexts/filter-context";
import { AppSidebar } from "./sidebar";

export function AppLayout() {
  return (
    <TooltipProvider>
      <FilterProvider>
        <SidebarProvider>
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
              <SidebarTrigger />
              <DateRangeFilter />
            </div>
            <SidebarInset className="min-h-0 min-w-0 overflow-x-hidden">
              <Outlet />
            </SidebarInset>
          </div>
        </SidebarProvider>
      </FilterProvider>
    </TooltipProvider>
  );
}
