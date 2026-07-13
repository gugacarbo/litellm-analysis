import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSession = createServerFn({ method: "GET" })
  .validator(z.object({}))
  .handler(async () => {
    const [{ getAuth }, { requireSession }] = await Promise.all([
      import("./auth"),
      import("./invites"),
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

    return { ok: true as const, session: result.session };
  });
