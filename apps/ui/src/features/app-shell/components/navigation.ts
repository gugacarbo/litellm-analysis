import {
  BoxesIcon,
  ClipboardListIcon,
  CodeXmlIcon,
  KeyRoundIcon,
  LayoutDashboard,
  PlugIcon,
} from "lucide-react";
import type { ComponentType } from "react";

export type NavigationItem = {
  label: string;
  to: "/" | "/models" | "/providers" | "/secrets" | "/coding-agents" | "/audit";
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
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
    label: "Secrets",
    to: "/secrets",
    icon: KeyRoundIcon,
  },
  {
    label: "Providers",
    to: "/providers",
    icon: PlugIcon,
  },
  {
    label: "Coding Agents",
    to: "/coding-agents",
    icon: CodeXmlIcon,
    adminOnly: true,
  },
  {
    label: "Audit",
    to: "/audit",
    icon: ClipboardListIcon,
    adminOnly: true,
  },
];

export function navigationItemsForRole(
  role?: string,
): readonly NavigationItem[] {
  return navigationItems.filter((item) => !item.adminOnly || role === "admin");
}

export function isNavigationItemActive(
  item: NavigationItem,
  pathname: string,
): boolean {
  return item.to === "/"
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(`${item.to}/`);
}
