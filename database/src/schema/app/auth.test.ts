import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  account,
  appInvites,
  session,
  user,
  verification,
} from "./auth";
import {
  accountInsertSchema,
  accountSelectSchema,
  accountUpdateSchema,
  appInviteInsertSchema,
  appInviteSelectSchema,
  appInviteUpdateSchema,
  sessionInsertSchema,
  sessionSelectSchema,
  sessionUpdateSchema,
  userInsertSchema,
  userSelectSchema,
  userUpdateSchema,
  verificationInsertSchema,
  verificationSelectSchema,
  verificationUpdateSchema,
} from "./auth.schemas";

describe("authentication database schema", () => {
  it("defines the Better Auth tables and the application invite table", () => {
    expect(getTableName(user)).toBe("user");
    expect(getTableName(session)).toBe("session");
    expect(getTableName(account)).toBe("account");
    expect(getTableName(verification)).toBe("verification");
    expect(getTableName(appInvites)).toBe("app_invite");
  });

  it("derives select schemas for persisted rows", () => {
    expect(
      userSelectSchema.parse({
        id: "user-1",
        name: "Ada",
        email: "ada@example.com",
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toMatchObject({ id: "user-1", email: "ada@example.com" });

    expect(
      appInviteSelectSchema.parse({
        id: "invite-1",
        email: "ada@example.com",
        tokenHash: "hash",
        role: "viewer",
        expiresAt: new Date(),
        usedAt: null,
        createdAt: new Date(),
        createdByUserId: null,
      }),
    ).toMatchObject({ id: "invite-1", role: "viewer" });
  });

  it("derives insert schemas with defaults and required fields", () => {
    expect(
      userInsertSchema.parse({
        id: "user-1",
        name: "Ada",
        email: "ada@example.com",
      }),
    ).toMatchObject({ id: "user-1", name: "Ada" });

    expect(
      appInviteInsertSchema.parse({
        id: "invite-1",
        email: "ada@example.com",
        tokenHash: "hash",
        role: "admin",
        expiresAt: new Date(),
      }),
    ).toMatchObject({ id: "invite-1", role: "admin" });

    expect(() => appInviteInsertSchema.parse({ email: "ada@example.com" })).toThrow();
  });

  it("derives update schemas without requiring the full row", () => {
    expect(userUpdateSchema.parse({ name: "Grace" })).toEqual({ name: "Grace" });
    expect(sessionUpdateSchema.parse({ userAgent: "browser" })).toEqual({
      userAgent: "browser",
    });
    expect(accountUpdateSchema.parse({ scope: "openid" })).toEqual({ scope: "openid" });
    expect(verificationUpdateSchema.parse({ value: "new-value" })).toEqual({
      value: "new-value",
    });
    expect(appInviteUpdateSchema.parse({ usedAt: new Date() })).toMatchObject({
      usedAt: expect.any(Date),
    });
  });

  it("rejects invalid enum values and malformed persisted data", () => {
    expect(() => appInviteInsertSchema.parse({
      id: "invite-1",
      email: "ada@example.com",
      tokenHash: "hash",
      role: "owner",
      expiresAt: new Date(),
    })).toThrow();

    expect(() => userSelectSchema.parse({ id: "user-1" })).toThrow();
  });
});
