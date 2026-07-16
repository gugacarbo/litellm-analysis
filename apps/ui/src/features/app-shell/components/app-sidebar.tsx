import type { ReactNode } from "react";
import {
  isNavigationItemActive,
  navigationItemsForRole,
} from "@/features/app-shell/components/navigation";
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
} from "@/shared/components/ui/sidebar";

export type AppSidebarProps = {
  accountMenu?: ReactNode;
  pathname: string;
  userRole?: string;
};

function NavigationMenu({
  pathname,
  userRole,
}: Pick<AppSidebarProps, "pathname" | "userRole">) {
  return (
    <SidebarMenu className="gap-1">
      {navigationItemsForRole(userRole).map((item) => {
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

export function AppSidebar({
  accountMenu,
  pathname,
  userRole,
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-12 min-w-0 items-center gap-2 overflow-hidden px-0">
          <img
            alt=""
            aria-hidden="true"
            className="size-10 shrink-0"
            src="/llmtoolbox-mark.svg"
          />
          <span className="whitespace-nowrap font-semibold opacity-100 transition-opacity delay-100 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0">
            LlmToolbox
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavigationMenu pathname={pathname} userRole={userRole} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {accountMenu ? <SidebarFooter>{accountMenu}</SidebarFooter> : null}
      <SidebarRail />
    </Sidebar>
  );
}
