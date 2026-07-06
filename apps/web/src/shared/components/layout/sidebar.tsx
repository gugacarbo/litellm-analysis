import * as Collapsible from "@radix-ui/react-collapsible";
import {
  Activity,
  Bot,
  ChevronDown,
  ChevronRight,
  Cpu,
  FileText,
  GitBranch,
  Globe,
  HeartPulse,
  PanelLeftIcon,
  Scale,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/shared/components/ui/sidebar";

interface NavLeaf {
  id: string;
  to: string;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
}

interface NavBranch {
  id: string;
  to?: string;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: NavLeaf[];
}

type NavItem = NavLeaf | NavBranch;

function isBranch(item: NavItem): item is NavBranch {
  return "children" in item;
}

function NavItemLeaf({ item }: { item: NavLeaf }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.label}>
        <NavLink to={item.to}>
          {item.icon && <item.icon className="h-4 w-4" />}
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavItemBranch({ item }: { item: NavBranch }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <SidebarMenuItem>
        <Collapsible.Trigger asChild>
          {item.to ? (
            <SidebarMenuButton asChild tooltip={item.label}>
              <NavLink to={item.to}>
                {item.icon && <item.icon className="h-4 w-4" />}
                <span className="flex-1">{item.label}</span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </NavLink>
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton tooltip={item.label}>
              {item.icon && <item.icon className="h-4 w-4" />}
              <span className="flex-1">{item.label}</span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </SidebarMenuButton>
          )}
        </Collapsible.Trigger>
      </SidebarMenuItem>
      <Collapsible.Content>
        <SidebarMenuSub>
          {item.children.map((child) => (
            <SidebarMenuSubItem key={child.id}>
              <SidebarMenuSubButton asChild>
                <NavLink to={child.to}>
                  {child.icon && <child.icon className="h-4 w-4" />}
                  <span>{child.label}</span>
                </NavLink>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export function AppSidebar() {
  const navItems: NavItem[] = [
    { id: "dashboard", to: "/", icon: Activity, label: "Dashboard" },
    { id: "model-stats", to: "/model-stats", icon: TrendingUp, label: "Stats" },
    { id: "logs", to: "/logs", icon: FileText, label: "Logs" },
    {
      id: "agents",
      icon: Bot,
      label: "Agents",
      children: [
        { id: "agents-config", to: "/agents", label: "Config", icon: Settings },
        { id: "plugins", to: "/plugins", label: "Plugins", icon: GitBranch },
      ],
    },
    {
      id: "models",
      to: "/models",
      icon: Cpu,
      label: "Models",
      children: [
        { id: "models-list", to: "/models", icon: Cpu, label: "Models" },
        {
          id: "models-aliases",
          to: "/models/aliases",
          icon: GitBranch,
          label: "Aliases",
        },
        {
          id: "models-providers",
          to: "/models/providers",
          icon: Settings,
          label: "Providers",
        },
        {
          id: "models-health-check",
          to: "/models/health-check",
          icon: HeartPulse,
          label: "Health Check",
        },
      ],
    },
    {
      id: "benchmarks",
      icon: Scale,
      label: "Benchmarks",
      children: [
        {
          id: "benchmarks-aa",
          to: "/benchmarks",
          icon: Scale,
          label: "Artificial Analysis",
        },
        {
          id: "benchmarks-or",
          to: "/benchmarks/openrouter",
          icon: Globe,
          label: "OpenRouter",
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <PanelLeftIcon className="h-5 w-5" />
          <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">
            LiteLLM Stats
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) =>
                isBranch(item) ? (
                  <NavItemBranch key={item.id} item={item} />
                ) : (
                  <NavItemLeaf key={item.id} item={item} />
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
