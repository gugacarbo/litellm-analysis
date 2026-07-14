import { ChevronsUpDown, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";
import { authClient } from "@/shared/lib/auth-client";

type ThemePreference = "light" | "dark";

type AccountMenuProps = Readonly<{
  name: string;
  email: string;
  role: string;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => Promise<void> | void;
}>;

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AccountMenu({
  name,
  email,
  role,
  theme,
  onThemeChange,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isChangingTheme, setIsChangingTheme] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextTheme = theme === "dark" ? "light" : "dark";

  const handleSignOut = async () => {
    setError(null);
    setIsSigningOut(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setError("Could not sign out. Please try again.");
        setOpen(true);
        return;
      }

      globalThis.location.assign("/login");
    } catch {
      setError("Could not sign out. Please try again.");
      setOpen(true);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleThemeToggle = async () => {
    setError(null);
    setIsChangingTheme(true);

    try {
      await onThemeChange(nextTheme);
    } catch {
      setError("Could not save theme preference. Try again.");
      setOpen(true);
    } finally {
      setIsChangingTheme(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
                size="lg"
              >
                <Avatar>
                  <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent align="end" className="w-64" side="right">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="space-y-1">
                <div className="truncate text-foreground">{name}</div>
                <div className="truncate font-normal text-muted-foreground">
                  {email}
                </div>
                <div className="font-normal text-muted-foreground">{role}</div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isChangingTheme}
              onClick={() => void handleThemeToggle()}
            >
              {nextTheme === "dark" ? (
                <Moon aria-hidden="true" />
              ) : (
                <Sun aria-hidden="true" />
              )}
              {isChangingTheme
                ? "Saving theme..."
                : `Switch to ${nextTheme} theme`}
            </DropdownMenuItem>
            {error ? (
              <Alert aria-label="Account menu error" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <DropdownMenuItem
              disabled={isSigningOut}
              onClick={() => void handleSignOut()}
              variant="destructive"
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
