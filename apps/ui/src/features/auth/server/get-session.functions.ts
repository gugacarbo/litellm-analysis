import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type AuthSessionUser = {
  name?: unknown;
  email?: unknown;
};

type AuthSessionResponse = {
  user?: AuthSessionUser;
};

export type ShellSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "viewer";
  };
};

export function projectPublicSession(
  session: { user: { id: string; role: string } },
  user: AuthSessionUser,
): ShellSession {
  return {
    user: {
      id: session.user.id,
      name: typeof user.name === "string" ? user.name : "",
      email: typeof user.email === "string" ? user.email : "",
      role: session.user.role === "admin" ? "admin" : "viewer",
    },
  };
}

export const getSession = createServerFn({ method: "GET" })
  .validator(z.object({}))
  .handler(async () => {
    const [{ getAuth }, { requireSession }] = await Promise.all([
      import("@/features/auth/server/auth"),
      import("@/features/auth/server/invites"),
    ]);
    const auth = getAuth();
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();

    if (!request) {
      return {
        ok: false as const,
        error: {
          code: "UNAUTHENTICATED" as const,
          message: "No request",
        },
      };
    }

    const result = await requireSession({ auth, request });
    if (!result.ok) {
      return {
        ok: false as const,
        error: {
          code: "UNAUTHENTICATED" as const,
          message: result.error.message,
        },
      };
    }

    const response = await auth.handler(
      new Request("http://localhost/api/auth/get-session", {
        method: "GET",
        headers: { cookie: request.headers.get("cookie") ?? "" },
      }),
    );
    const body = response.ok
      ? ((await response.json()) as AuthSessionResponse)
      : {};

    return {
      ok: true as const,
      session: projectPublicSession(result.session, body.user ?? {}),
    };
  });
