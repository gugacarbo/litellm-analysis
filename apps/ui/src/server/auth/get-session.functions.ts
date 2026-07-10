import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAuth } from "./auth";
import { requireSession } from "./invites";

export const getSession = createServerFn({ method: "GET" })
  .validator(z.object({}))
  .handler(async () => {
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
