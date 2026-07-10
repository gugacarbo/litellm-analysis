import { createHash, randomBytes } from "node:crypto";
import { appInvites } from "@lite-llm/database/schema/app";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { Auth } from "./auth";

export const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SessionData = {
  user: { id: string; role: string };
  session: { id: string };
};

export type SessionResult =
  | { ok: true; session: SessionData }
  | { ok: false; error: { code: "UNAUTHENTICATED"; message: string } };

export type RoleResult =
  | { ok: true }
  | { ok: false; error: { code: "FORBIDDEN"; message: string } };

export type InviteResult =
  | { ok: true; userId: string; sessionCreated?: true; inviteToken?: string }
  | {
      ok: false;
      error: {
        code: "INVALID_INVITE" | "UNAUTHENTICATED" | "FORBIDDEN" | "INTERNAL";
        message: string;
      };
    };

export async function requireSession(params: {
  auth: Auth;
  request: Request;
}): Promise<SessionResult> {
  try {
    const response = await params.auth.handler(
      new Request("http://localhost/api/auth/get-session", {
        method: "GET",
        headers: { cookie: params.request.headers.get("cookie") ?? "" },
      }),
    );

    if (!response.ok) {
      return {
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "No valid session found" },
      };
    }

    const body = (await response.json()) as {
      user?: { id: string; role?: string };
      session?: { id: string };
    } | null;

    if (!body?.user || !body?.session) {
      return {
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "No valid session found" },
      };
    }

    return {
      ok: true,
      session: {
        user: { id: body.user.id, role: body.user.role ?? "viewer" },
        session: { id: body.session.id },
      },
    };
  } catch {
    return {
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "No valid session found" },
    };
  }
}

export async function requireRole(params: {
  session: SessionData;
  role: string;
}): Promise<RoleResult> {
  if (params.session.user.role !== params.role) {
    return {
      ok: false,
      error: { code: "FORBIDDEN", message: `Role '${params.role}' required` },
    };
  }

  return { ok: true };
}

export async function acceptInvite(params: {
  auth: Auth;
  inviteToken: string;
  email: string;
  name: string;
  password: string;
}): Promise<InviteResult> {
  try {
    const tokenHash = createHash("sha256")
      .update(params.inviteToken)
      .digest("hex");

    const [invite] = await params.auth.db
      .select()
      .from(appInvites)
      .where(
        and(
          eq(appInvites.tokenHash, tokenHash),
          isNull(appInvites.usedAt),
          gt(appInvites.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!invite) {
      return {
        ok: false,
        error: { code: "INVALID_INVITE", message: "Invalid or expired invite" },
      };
    }

    // Atomic consumption: only one concurrent request can set used_at
    const [updated] = await params.auth.db
      .update(appInvites)
      .set({ usedAt: new Date() })
      .where(and(eq(appInvites.id, invite.id), isNull(appInvites.usedAt)))
      .returning();

    if (!updated) {
      return {
        ok: false,
        error: { code: "INVALID_INVITE", message: "Invalid or expired invite" },
      };
    }

    // Create user via Better Auth sign-up API
    const signUpResponse = await params.auth.handler(
      new Request("http://localhost/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: params.email,
          password: params.password,
          name: params.name,
        }),
      }),
    );

    if (!signUpResponse.ok) {
      // Rollback: mark invite as unused
      await params.auth.db
        .update(appInvites)
        .set({ usedAt: null })
        .where(eq(appInvites.id, invite.id));

      return {
        ok: false,
        error: { code: "INTERNAL", message: "Failed to create account" },
      };
    }

    const signUpBody = (await signUpResponse.json()) as {
      user?: { id: string };
      token?: string;
    };

    return {
      ok: true,
      userId: signUpBody.user?.id ?? "",
      sessionCreated: true,
    };
  } catch {
    return {
      ok: false,
      error: { code: "INTERNAL", message: "An unexpected error occurred" },
    };
  }
}

export async function createInvite(params: {
  auth: Auth;
  request: Request;
  email?: string;
  role: "admin" | "viewer";
}): Promise<InviteResult> {
  try {
    // First validate session
    const sessionResult = await requireSession({
      auth: params.auth,
      request: params.request,
    });

    if (!sessionResult.ok) {
      return {
        ok: false,
        error: {
          code: sessionResult.error.code,
          message: sessionResult.error.message,
        },
      };
    }

    // Then validate role
    const roleResult = await requireRole({
      session: sessionResult.session,
      role: "admin",
    });

    if (!roleResult.ok) {
      return {
        ok: false,
        error: {
          code: roleResult.error.code,
          message: roleResult.error.message,
        },
      };
    }

    // Check for existing valid invite for same email
    if (params.email) {
      const [existing] = await params.auth.db
        .select({ id: appInvites.id })
        .from(appInvites)
        .where(
          and(
            eq(appInvites.email, params.email),
            isNull(appInvites.usedAt),
            gt(appInvites.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (existing) {
        return {
          ok: false,
          error: {
            code: "INVALID_INVITE",
            message: "A valid invite already exists for this email",
          },
        };
      }
    }

    // Generate random 64-char hex token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

    await params.auth.db.insert(appInvites).values({
      id: randomBytes(16).toString("hex"),
      email: params.email ?? "",
      tokenHash,
      role: params.role,
      expiresAt,
      createdByUserId: sessionResult.session.user.id,
    });

    return {
      ok: true,
      userId: sessionResult.session.user.id,
      inviteToken: rawToken,
    };
  } catch {
    return {
      ok: false,
      error: { code: "INTERNAL", message: "An unexpected error occurred" },
    };
  }
}
