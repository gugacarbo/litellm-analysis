import { LayoutDashboard } from "lucide-react";
import type { ComponentType } from "react";

export type NavigationItem = {
  label: string;
  to: "/";
  icon: ComponentType<{ className?: string }>;
};

export const navigationItems: readonly NavigationItem[] = [
  {
    label: "Dashboard",
    to: "/",
    icon: LayoutDashboard,
  },
];

export function isNavigationItemActive(
  item: NavigationItem,
  pathname: string,
): boolean {
  return item.to === pathname;
}
