import { Moon, Sun } from "lucide-react";
import { useState } from "react";

export type ThemePreference = "light" | "dark";

export type ThemeControlProps = {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => Promise<void> | void;
  compact?: boolean;
};

export function ThemeControl({
  theme,
  onThemeChange,
  compact = false,
}: ThemeControlProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingTheme, setPendingTheme] = useState<ThemePreference | null>(
    null,
  );

  async function selectTheme(nextTheme: ThemePreference) {
    if (nextTheme === theme || pendingTheme) {
      return;
    }

    setError(null);
    setPendingTheme(nextTheme);

    try {
      await onThemeChange(nextTheme);
    } catch {
      setError("Could not save theme preference. Try again.");
    } finally {
      setPendingTheme(null);
    }
  }

  return (
    <div>
      <fieldset className="grid grid-cols-2 gap-1">
        <legend className="sr-only">Theme</legend>
        {(["light", "dark"] as const).map((choice) => (
          <button
            aria-pressed={theme === choice}
            className={`rounded-md text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent aria-pressed:bg-sidebar-accent aria-pressed:font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring disabled:cursor-wait disabled:opacity-70 ${
              compact
                ? "flex size-8 items-center justify-center"
                : "px-2 py-1.5"
            }`}
            disabled={pendingTheme !== null}
            key={choice}
            onClick={() => void selectTheme(choice)}
            type="button"
          >
            {choice === "light" ? (
              <Sun aria-hidden="true" className="size-4" />
            ) : (
              <Moon aria-hidden="true" className="size-4" />
            )}
            <span className={compact ? "sr-only" : undefined}>
              {choice === "light" ? "Light theme" : "Dark theme"}
            </span>
          </button>
        ))}
      </fieldset>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
