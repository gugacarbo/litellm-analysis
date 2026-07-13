import { appInvites, user } from "@lite-llm/database/schema";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { type Auth, createAuth } from "@/features/auth/server/auth";
import {
  acceptInvite,
  createInvite,
  INVITE_EXPIRY_MS,
  requireRole,
  requireSession,
} from "@/features/auth/server/invites";
import { createTestDb } from "@/features/auth/server/test-setup";

type TestContext = {
  auth: Auth;
  stop: () => Promise<void>;
};

async function setup(): Promise<TestContext> {
  const { db, stop } = await createTestDb();
  const auth = createAuth({ db, secret: "test-secret-for-bootstrap-only" });
  return { auth, stop };
}

describe("requireSession", () => {
  it("rejeita requisicao sem sessao com UNAUTHENTICATED", async () => {
    const ctx = await setup();
    try {
      const request = new Request("http://localhost/api/test", {
        method: "GET",
      });
      const result = await requireSession({ auth: ctx.auth, request });
      expect(result).toEqual({
        ok: false,
        error: { code: "UNAUTHENTICATED", message: expect.any(String) },
      });
    } finally {
      await ctx.stop();
    }
  });

  it("rejeita sessao expirada com UNAUTHENTICATED", async () => {
    const ctx = await setup();
    try {
      const bootstrap = await acceptInvite({
        auth: ctx.auth,
        inviteToken: "test-secret-for-bootstrap-only",
        email: "admin@example.com",
        name: "Admin",
        password: "secure-password-123",
      });
      if (!bootstrap.ok) throw new Error(bootstrap.error.message);
      expect(bootstrap.ok).toBe(true);

      const sessionCookie = bootstrap.sessionCreated
        ? await getCookieFromSignup(
            ctx.auth,
            "admin@example.com",
            "secure-password-123",
          )
        : "";

      await ctx.stop();
      const { db, stop: stop2 } = await createTestDb();
      const auth2 = createAuth({
        db,
        secret: "test-secret-for-bootstrap-only",
      });
      try {
        await expireAllSessions(db);
        const request = new Request("http://localhost/api/test", {
          method: "GET",
          headers: { cookie: sessionCookie },
        });
        const result = await requireSession({ auth: auth2, request });
        expect(result).toEqual({
          ok: false,
          error: { code: "UNAUTHENTICATED", message: expect.any(String) },
        });
      } finally {
        await stop2();
      }
    } finally {
      await ctx.stop();
    }
  });
});

describe("acceptInvite", () => {
  it("cria usuario e sessao com convite de bootstrap valido", async () => {
    const ctx = await setup();
    try {
      const result = await acceptInvite({
        auth: ctx.auth,
        inviteToken: "test-secret-for-bootstrap-only",
        email: "bootstrap@example.com",
        name: "Bootstrap",
        password: "secure-password-123",
      });
      expect(result).toMatchObject({
        ok: true,
        userId: expect.any(String),
        sessionCreated: true,
      });

      const users = await ctx.auth.db
        .select()
        .from(user)
        .where(eq(user.email, "bootstrap@example.com"));
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe("Bootstrap");
      expect(users[0].role).toBe("admin");
    } finally {
      await ctx.stop();
    }
  });

  it("rejeita convite invalido com INVALID_INVITE sem revelar detalhes", async () => {
    const ctx = await setup();
    try {
      const result = await acceptInvite({
        auth: ctx.auth,
        inviteToken: "not-a-real-token",
        email: "attacker@example.com",
        name: "Attacker",
        password: "secure-password-123",
      });
      expect(result).toEqual({
        ok: false,
        error: { code: "INVALID_INVITE", message: expect.any(String) },
      });
      const users = await ctx.auth.db.select().from(user);
      expect(users).toHaveLength(0);
    } finally {
      await ctx.stop();
    }
  });

  it("rejeita convite expirado com INVALID_INVITE", async () => {
    const ctx = await setup();
    try {
      const admin = await acceptInvite({
        auth: ctx.auth,
        inviteToken: "test-secret-for-bootstrap-only",
        email: "admin@example.com",
        name: "Admin",
        password: "secure-password-123",
      });
      if (!admin.ok) throw new Error(admin.error.message);

      const cookie = await getCookieFromSignup(
        ctx.auth,
        "admin@example.com",
        "secure-password-123",
      );

      const invite = await createInvite({
        auth: ctx.auth,
        request: new Request("http://localhost/api/test", {
          headers: { cookie },
        }),
        email: "expired@example.com",
        role: "viewer",
      });
      if (!invite.ok) throw new Error(invite.error.message);
      const expiredToken = invite.inviteToken;
      expect(expiredToken).toBeDefined();

      await expireAllInvites(ctx.auth.db);

      const result = await acceptInvite({
        auth: ctx.auth,
        inviteToken: expiredToken as string,
        email: "expired@example.com",
        name: "Expired",
        password: "secure-password-123",
      });
      expect(result).toEqual({
        ok: false,
        error: { code: "INVALID_INVITE", message: expect.any(String) },
      });
    } finally {
      await ctx.stop();
    }
  });

  it("rejeita convite reutilizado com INVALID_INVITE", async () => {
    const ctx = await setup();
    try {
      const admin = await acceptInvite({
        auth: ctx.auth,
        inviteToken: "test-secret-for-bootstrap-only",
        email: "admin@example.com",
        name: "Admin",
        password: "secure-password-123",
      });
      if (!admin.ok) throw new Error(admin.error.message);

      const cookie = await getCookieFromSignup(
        ctx.auth,
        "admin@example.com",
        "secure-password-123",
      );

      const invite = await createInvite({
        auth: ctx.auth,
        request: new Request("http://localhost/api/test", {
          headers: { cookie },
        }),
        email: "reuse@example.com",
        role: "viewer",
      });
      if (!invite.ok) throw new Error(invite.error.message);
      const token = invite.inviteToken as string;

      const first = await acceptInvite({
        auth: ctx.auth,
        inviteToken: token,
        email: "reuse@example.com",
        name: "Reuse",
        password: "secure-password-123",
      });
      expect(first.ok).toBe(true);

      const second = await acceptInvite({
        auth: ctx.auth,
        inviteToken: token,
        email: "reuse@example.com",
        name: "Reuse2",
        password: "secure-password-123",
      });
      expect(second).toEqual({
        ok: false,
        error: { code: "INVALID_INVITE", message: expect.any(String) },
      });
    } finally {
      await ctx.stop();
    }
  });

  it("impede consumo concorrente do mesmo convite", async () => {
    const ctx = await setup();
    try {
      const admin = await acceptInvite({
        auth: ctx.auth,
        inviteToken: "test-secret-for-bootstrap-only",
        email: "admin@example.com",
        name: "Admin",
        password: "secure-password-123",
      });
      if (!admin.ok) throw new Error(admin.error.message);

      const cookie = await getCookieFromSignup(
        ctx.auth,
        "admin@example.com",
        "secure-password-123",
      );

      const invite = await createInvite({
        auth: ctx.auth,
        request: new Request("http://localhost/api/test", {
          headers: { cookie },
        }),
        email: "concurrent@example.com",
        role: "viewer",
      });
      if (!invite.ok) throw new Error(invite.error.message);
      const token = invite.inviteToken as string;

      const results = await Promise.all([
        acceptInvite({
          auth: ctx.auth,
          inviteToken: token,
          email: "concurrent@example.com",
          name: "Concurrent",
          password: "secure-password-123",
        }),
        acceptInvite({
          auth: ctx.auth,
          inviteToken: token,
          email: "concurrent@example.com",
          name: "Concurrent",
          password: "secure-password-123",
        }),
      ]);

      const successes = results.filter((r) => r.ok);
      expect(successes).toHaveLength(1);
      const failures = results.filter(
        (r) => !r.ok && r.error.code === "INVALID_INVITE",
      );
      expect(failures).toHaveLength(1);
    } finally {
      await ctx.stop();
    }
  });
});

describe("createInvite", () => {
  it("exige sessao valida (UNAUTHENTICATED) para criar convite", async () => {
    const ctx = await setup();
    try {
      const result = await createInvite({
        auth: ctx.auth,
        request: new Request("http://localhost/api/test"),
        email: "new@example.com",
        role: "viewer",
      });
      expect(result).toEqual({
        ok: false,
        error: { code: "UNAUTHENTICATED", message: expect.any(String) },
      });
    } finally {
      await ctx.stop();
    }
  });

  it("exige papel admin (FORBIDDEN) para criar convite", async () => {
    const ctx = await setup();
    try {
      const bootstrap = await acceptInvite({
        auth: ctx.auth,
        inviteToken: "test-secret-for-bootstrap-only",
        email: "admin@example.com",
        name: "Admin",
        password: "secure-password-123",
      });
      if (!bootstrap.ok) throw new Error(bootstrap.error.message);

      const adminCookie = await getCookieFromSignup(
        ctx.auth,
        "admin@example.com",
        "secure-password-123",
      );

      const viewerInvite = await createInvite({
        auth: ctx.auth,
        request: new Request("http://localhost/api/test", {
          headers: { cookie: adminCookie },
        }),
        email: "viewer@example.com",
        role: "viewer",
      });
      if (!viewerInvite.ok) throw new Error(viewerInvite.error.message);
      const viewerToken = viewerInvite.inviteToken as string;

      const viewerAccept = await acceptInvite({
        auth: ctx.auth,
        inviteToken: viewerToken,
        email: "viewer@example.com",
        name: "Viewer",
        password: "secure-password-123",
      });
      if (!viewerAccept.ok) throw new Error(viewerAccept.error.message);

      const [viewer] = await ctx.auth.db
        .select()
        .from(user)
        .where(eq(user.email, "viewer@example.com"));
      expect(viewer?.role).toBe("viewer");

      const viewerCookie = await getCookieFromSignup(
        ctx.auth,
        "viewer@example.com",
        "secure-password-123",
      );

      const result = await createInvite({
        auth: ctx.auth,
        request: new Request("http://localhost/api/test", {
          headers: { cookie: viewerCookie },
        }),
        email: "another@example.com",
        role: "viewer",
      });
      expect(result).toEqual({
        ok: false,
        error: { code: "FORBIDDEN", message: expect.any(String) },
      });
    } finally {
      await ctx.stop();
    }
  });

  it("rejeita convite duplicado para mesmo email enquanto valido", async () => {
    const ctx = await setup();
    try {
      const bootstrap = await acceptInvite({
        auth: ctx.auth,
        inviteToken: "test-secret-for-bootstrap-only",
        email: "admin@example.com",
        name: "Admin",
        password: "secure-password-123",
      });
      if (!bootstrap.ok) throw new Error(bootstrap.error.message);

      const cookie = await getCookieFromSignup(
        ctx.auth,
        "admin@example.com",
        "secure-password-123",
      );

      const first = await createInvite({
        auth: ctx.auth,
        request: new Request("http://localhost/api/test", {
          headers: { cookie },
        }),
        email: "duplicate@example.com",
        role: "viewer",
      });
      expect(first.ok).toBe(true);

      const second = await createInvite({
        auth: ctx.auth,
        request: new Request("http://localhost/api/test", {
          headers: { cookie },
        }),
        email: "duplicate@example.com",
        role: "viewer",
      });
      expect(second).toEqual({
        ok: false,
        error: {
          code: "INVALID_INVITE",
          message: expect.stringMatching(/duplicate|duplicat|existent|já/i),
        },
      });
    } finally {
      await ctx.stop();
    }
  });

  it("retorna o token apenas na resposta inicial", async () => {
    const ctx = await setup();
    try {
      const bootstrap = await acceptInvite({
        auth: ctx.auth,
        inviteToken: "test-secret-for-bootstrap-only",
        email: "admin@example.com",
        name: "Admin",
        password: "secure-password-123",
      });
      if (!bootstrap.ok) throw new Error(bootstrap.error.message);

      const cookie = await getCookieFromSignup(
        ctx.auth,
        "admin@example.com",
        "secure-password-123",
      );

      const result = await createInvite({
        auth: ctx.auth,
        request: new Request("http://localhost/api/test", {
          headers: { cookie },
        }),
        email: "once@example.com",
        role: "admin",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("Expected invite creation to succeed");
      expect(result.inviteToken).toBeDefined();
      expect(typeof result.inviteToken).toBe("string");
      expect(result.inviteToken).toHaveLength(64);
    } finally {
      await ctx.stop();
    }
  });
});

describe("requireRole", () => {
  it("permite admin e rejeita viewer", async () => {
    const ctx = await setup();
    try {
      const admin = await acceptInvite({
        auth: ctx.auth,
        inviteToken: "test-secret-for-bootstrap-only",
        email: "admin@example.com",
        name: "Admin",
        password: "secure-password-123",
      });
      if (!admin.ok) throw new Error(admin.error.message);

      const adminCookie = await getCookieFromSignup(
        ctx.auth,
        "admin@example.com",
        "secure-password-123",
      );
      const adminSession = await requireSession({
        auth: ctx.auth,
        request: new Request("http://localhost/api/test", {
          headers: { cookie: adminCookie },
        }),
      });
      if (!adminSession.ok) throw new Error(adminSession.error.message);

      const adminRole = await requireRole({
        session: adminSession.session,
        role: "admin",
      });
      expect(adminRole.ok).toBe(true);

      const viewerInvite = await createInvite({
        auth: ctx.auth,
        request: new Request("http://localhost/api/test", {
          headers: { cookie: adminCookie },
        }),
        email: "viewer-role@example.com",
        role: "viewer",
      });
      if (!viewerInvite.ok) throw new Error(viewerInvite.error.message);
      const viewerToken = viewerInvite.inviteToken as string;

      await acceptInvite({
        auth: ctx.auth,
        inviteToken: viewerToken,
        email: "viewer-role@example.com",
        name: "Viewer",
        password: "secure-password-123",
      });
      const viewerCookie = await getCookieFromSignup(
        ctx.auth,
        "viewer-role@example.com",
        "secure-password-123",
      );
      const viewerSession = await requireSession({
        auth: ctx.auth,
        request: new Request("http://localhost/api/test", {
          headers: { cookie: viewerCookie },
        }),
      });
      if (!viewerSession.ok) throw new Error(viewerSession.error.message);

      const viewerRole = await requireRole({
        session: viewerSession.session,
        role: "admin",
      });
      expect(viewerRole).toEqual({
        ok: false,
        error: { code: "FORBIDDEN", message: expect.any(String) },
      });
    } finally {
      await ctx.stop();
    }
  });
});

async function getCookieFromSignup(
  auth: Auth,
  email: string,
  password: string,
): Promise<string> {
  const response = await auth.handler(
    new Request("http://localhost/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) throw new Error("sign-in did not set cookie");
  return setCookie.split(";")[0];
}

async function expireAllInvites(db: Auth["db"]): Promise<void> {
  await db.update(appInvites).set({
    expiresAt: new Date(Date.now() - INVITE_EXPIRY_MS - 1),
  });
}

async function expireAllSessions(db: Auth["db"]): Promise<void> {
  const { sql } = await import("drizzle-orm");
  await db.execute(
    sql`UPDATE "session" SET "expires_at" = NOW() - INTERVAL '1 hour'`,
  );
}
