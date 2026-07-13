import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: (search.returnTo as string) || "/",
    inviteToken: search.inviteToken as string | undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { returnTo, inviteToken } = Route.useSearch();
  const [mode, setMode] = useState<"sign-in" | "accept-invite">(
    inviteToken ? "accept-invite" : "sign-in",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(result?.message ?? "Invalid credentials");
        return;
      }

      window.location.href = returnTo;
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          inviteToken,
          email,
          name,
          password,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setError(result.error?.message ?? "Failed to accept invite");
        return;
      }

      window.location.href = returnTo;
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "accept-invite") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="max-w-md w-full p-8 bg-card text-card-foreground rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center">Accept Invite</h1>
          {error && (
            <p className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </p>
          )}
          <form onSubmit={handleAcceptInvite} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:ring-ring focus:border-ring"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:ring-ring focus:border-ring"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:ring-ring focus:border-ring"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Accept Invite & Sign In"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setMode("sign-in");
                setError("");
              }}
              className="text-primary hover:underline"
            >
              Already have an account? Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="max-w-md w-full p-8 bg-card text-card-foreground rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        {error && (
          <p className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </p>
        )}
        <form onSubmit={handleSignIn} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:ring-ring focus:border-ring"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:ring-ring focus:border-ring"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              setMode("accept-invite");
              setError("");
            }}
            className="text-primary hover:underline"
          >
            Have an invite token? Accept invite
          </button>
        </p>
      </div>
    </div>
  );
}
