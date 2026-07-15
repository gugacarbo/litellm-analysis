import type { ReactNode } from "react";
import { AppSidebar } from "@/features/app-shell/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/components/ui/sidebar";

export type AppShellProps = {
  accountMenu?: ReactNode;
  children?: ReactNode;
  pathname: string;
  sidebar: "expanded" | "collapsed";
  onSidebarChange: (sidebar: "expanded" | "collapsed") => Promise<void> | void;
};

export function AppShell({
  accountMenu,
  children,
  pathname,
  sidebar,
  onSidebarChange,
}: AppShellProps) {
  return (
    <SidebarProvider
      onOpenChange={(open) =>
        void onSidebarChange(open ? "expanded" : "collapsed")
      }
      open={sidebar === "expanded"}
    >
      <AppSidebar accountMenu={accountMenu} pathname={pathname} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
          <SidebarTrigger />
          <span className="font-semibold">Dashboard</span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
