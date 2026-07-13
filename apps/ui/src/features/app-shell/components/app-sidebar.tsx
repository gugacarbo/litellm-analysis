import type { ReactNode } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "../../../shared/components/ui/sidebar";
import { isNavigationItemActive, navigationItems } from "./navigation";

export type AppSidebarProps = {
  accountMenu?: ReactNode;
  pathname: string;
};

function NavigationMenu({ pathname }: Pick<AppSidebarProps, "pathname">) {
  return (
    <SidebarMenu>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = isNavigationItemActive(item, pathname);

        return (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton
              isActive={isActive}
              render={
                <a aria-current={isActive ? "page" : undefined} href={item.to}>
                  <Icon />
                  <span>{item.label}</span>
                </a>
              }
              tooltip={item.label}
            />
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar({ accountMenu, pathname }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-8 min-w-0 items-center overflow-hidden px-2">
          <span className="whitespace-nowrap font-semibold opacity-100 transition-opacity delay-100 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0">
            LiteLLM Analytics
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavigationMenu pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {accountMenu ? <SidebarFooter>{accountMenu}</SidebarFooter> : null}
      <SidebarRail />
    </Sidebar>
  );
}
