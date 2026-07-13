import { useState } from "react";

import { authClient } from "../../lib/auth-client";

type AccountMenuProps = Readonly<{
  name: string;
  email: string;
  role: string;
}>;

export function AccountMenu({ name, email, role }: AccountMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setError(null);
    setIsSigningOut(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setError("Could not sign out. Please try again.");
        return;
      }

      globalThis.location.assign("/login");
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <section aria-label="Account menu" className="space-y-4">
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Name</dt>
          <dd>{name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Role</dt>
          <dd>{role}</dd>
        </div>
      </dl>

      {error ? (
        <p aria-label="Could not sign out" role="alert">
          {error}
        </p>
      ) : null}

      <button type="button" disabled={isSigningOut} onClick={handleSignOut}>
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>
    </section>
  );
}
