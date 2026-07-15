import { BoxesIcon, LayoutDashboard, PlugIcon } from "lucide-react";
import type { ComponentType } from "react";

export type NavigationItem = {
  label: string;
  to: "/" | "/models" | "/providers";
  icon: ComponentType<{ className?: string }>;
};

export const navigationItems: readonly NavigationItem[] = [
  {
    label: "Dashboard",
    to: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Models",
    to: "/models",
    icon: BoxesIcon,
  },
  {
    label: "Providers",
    to: "/providers",
    icon: PlugIcon,
  },
];

export function isNavigationItemActive(
  item: NavigationItem,
  pathname: string,
): boolean {
  return item.to === "/"
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(`${item.to}/`);
}
