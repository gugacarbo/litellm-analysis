import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/accept-invite")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const [{ getAuth }, { acceptInvite }] = await Promise.all([
          import("@/features/auth/server/auth"),
          import("@/features/auth/server/invites"),
        ]);
        const auth = getAuth();
        const body = (await request.json()) as {
          inviteToken?: string;
          email?: string;
          name?: string;
          password?: string;
        };

        if (!body.inviteToken || !body.email || !body.name || !body.password) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: {
                code: "INVALID_INVITE",
                message: "Missing required fields",
              },
            }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        const result = await acceptInvite({
          auth,
          inviteToken: body.inviteToken,
          email: body.email,
          name: body.name,
          password: body.password,
        });

        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
