import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import {
  isNavigationItemActive,
  type NavigationItem,
  navigationItems,
} from "./navigation";
import { ThemeControl, type ThemePreference } from "./theme-control";

export type SidebarPreference = "expanded" | "collapsed";

export type AppSidebarProps = {
  pathname: string;
  sidebar: SidebarPreference;
  theme: ThemePreference;
  onSidebarChange: (sidebar: SidebarPreference) => Promise<void> | void;
  onThemeChange: (theme: ThemePreference) => Promise<void> | void;
  onNavigate?: () => void;
  showDesktopToggle?: boolean;
};

function NavigationLink({
  item,
  pathname,
  onNavigate,
  compact,
}: {
  item: NavigationItem;
  pathname: string;
  onNavigate?: () => void;
  compact: boolean;
}) {
  const Icon = item.icon;
  const isActive = isNavigationItemActive(item, pathname);

  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center rounded-md py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground ${
        compact ? "justify-center px-2" : "gap-3 px-3"
      }`}
      href={item.to}
      onClick={onNavigate}
    >
      <Icon aria-hidden="true" className="size-4" />
      <span className={compact ? "sr-only" : undefined}>Dashboard</span>
    </a>
  );
}

export function AppSidebar({
  pathname,
  sidebar,
  theme,
  onSidebarChange,
  onThemeChange,
  onNavigate,
  showDesktopToggle = false,
}: AppSidebarProps) {
  const isExpanded = sidebar === "expanded";
  const nextSidebar = isExpanded ? "collapsed" : "expanded";
  const compact = !isExpanded && showDesktopToggle;

  return (
    <div
      className="flex h-full flex-col bg-sidebar text-sidebar-foreground"
      data-sidebar={sidebar}
    >
      <div
        className={`flex h-14 items-center border-b border-sidebar-border ${
          compact ? "justify-center px-2" : "justify-between px-3"
        }`}
      >
        <span className={compact ? "sr-only" : "font-semibold"}>
          LiteLLM Analytics
        </span>
        {showDesktopToggle ? (
          <button
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            className="rounded-md p-2 hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            onClick={() => void onSidebarChange(nextSidebar)}
            type="button"
          >
            {isExpanded ? (
              <PanelLeftClose aria-hidden="true" className="size-4" />
            ) : (
              <PanelLeftOpen aria-hidden="true" className="size-4" />
            )}
          </button>
        ) : null}
      </div>

      <nav aria-label="Primary navigation" className="p-2">
        {navigationItems.map((item) => (
          <NavigationLink
            item={item}
            key={item.to}
            compact={compact}
            onNavigate={onNavigate}
            pathname={pathname}
          />
        ))}
      </nav>

      <div className="mt-auto border-t border-sidebar-border p-3">
        <ThemeControl
          compact={compact}
          onThemeChange={onThemeChange}
          theme={theme}
        />
      </div>
    </div>
  );
}
