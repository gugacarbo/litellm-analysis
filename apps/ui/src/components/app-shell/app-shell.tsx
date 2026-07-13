import { Drawer } from "@base-ui/react/drawer";
import { Menu, X } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";

import { AppSidebar, type SidebarPreference } from "./app-sidebar";
import type { ThemePreference } from "./theme-control";

export type AppShellProps = {
  accountMenu?: ReactNode;
  children?: ReactNode;
  pathname: string;
  sidebar: SidebarPreference;
  theme: ThemePreference;
  onSidebarChange: (sidebar: SidebarPreference) => Promise<void> | void;
  onThemeChange: (theme: ThemePreference) => Promise<void> | void;
};

export function AppShell({
  accountMenu,
  children,
  pathname,
  sidebar,
  theme,
  onSidebarChange,
  onThemeChange,
}: AppShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex h-14 items-center gap-3 border-b border-border px-4">
        <button
          aria-expanded={mobileDrawerOpen}
          aria-haspopup="dialog"
          aria-label="Open navigation"
          className="rounded-md p-2 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
          onClick={() => setMobileDrawerOpen(true)}
          ref={mobileMenuButtonRef}
          type="button"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <span className="font-semibold lg:hidden">Dashboard</span>
        {accountMenu ? <div className="ml-auto">{accountMenu}</div> : null}
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <aside
          className={`hidden shrink-0 border-r border-sidebar-border transition-[width] lg:block ${
            sidebar === "expanded" ? "lg:w-64" : "lg:w-16"
          } overflow-hidden`}
        >
          <AppSidebar
            onSidebarChange={onSidebarChange}
            onThemeChange={onThemeChange}
            pathname={pathname}
            showDesktopToggle
            sidebar={sidebar}
            theme={theme}
          />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <Drawer.Root
        modal
        onOpenChange={(open) => setMobileDrawerOpen(open)}
        open={mobileDrawerOpen}
      >
        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/50" />
          <Drawer.Viewport className="fixed inset-0 z-50">
            <Drawer.Popup
              aria-label="Mobile navigation"
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] border-r border-sidebar-border bg-sidebar shadow-xl"
              finalFocus={mobileMenuButtonRef}
              initialFocus
              role="dialog"
            >
              <Drawer.Content className="h-full">
                <div className="flex justify-end p-2">
                  <Drawer.Close
                    aria-label="Close navigation"
                    className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
                  >
                    <X aria-hidden="true" className="size-5" />
                  </Drawer.Close>
                </div>
                <AppSidebar
                  onNavigate={() => setMobileDrawerOpen(false)}
                  onSidebarChange={onSidebarChange}
                  onThemeChange={onThemeChange}
                  pathname={pathname}
                  sidebar={sidebar}
                  theme={theme}
                />
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
