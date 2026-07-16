import { describe, expect, it } from "vitest";
import { AuditEventError } from "../types/audit-events.js";
import { REDACTED_AUDIT_VALUE, redactAuditJson } from "./audit-redaction.js";

describe("redactAuditJson", () => {
  it("redacts normalized sensitive keys, nested values, and credential strings without mutating input", () => {
    const input = {
      authorization: "Bearer audit-token-should-not-persist",
      "Set-Cookie": "audit-cookie-should-not-persist",
      apiKey: "audit-secret-should-not-persist",
      credentialEnvelope: "secret",
      access_token: "secret",
      refreshToken: "secret",
      idToken: "secret",
      password: "secret",
      Secret: "secret",
      token: "secret",
      keyHash: "secret",
      fingerprint: "audit-fingerprint-should-not-persist",
      IV: "secret",
      tag: "secret",
      nested: [{ safe: "value", opaque: "Bearer sk-audit-should-not-persist" }],
      partialPrefixes: ["sk-a", "pk_a", "xoxb-a", "AIzaabc"],
      unicode: { "X API KEY": "secret" },
    };

    const output = redactAuditJson(input) as Record<string, unknown>;
    for (const key of [
      "authorization",
      "Set-Cookie",
      "apiKey",
      "credentialEnvelope",
      "access_token",
      "refreshToken",
      "idToken",
      "password",
      "Secret",
      "token",
      "keyHash",
      "fingerprint",
      "IV",
      "tag",
    ]) {
      expect(output[key]).toBe(REDACTED_AUDIT_VALUE);
    }
    expect((output.nested as Array<Record<string, string>>)[0]?.opaque).toBe(
      REDACTED_AUDIT_VALUE,
    );
    expect((output.unicode as Record<string, string>)["X API KEY"]).toBe(
      REDACTED_AUDIT_VALUE,
    );
    expect(output.partialPrefixes).toEqual([
      REDACTED_AUDIT_VALUE,
      REDACTED_AUDIT_VALUE,
      REDACTED_AUDIT_VALUE,
      REDACTED_AUDIT_VALUE,
    ]);
    expect(input.authorization).toBe("Bearer audit-token-should-not-persist");
  });

  it("rejects every non-AuditJson runtime value with a stable error", () => {
    class CustomValue {}
    const nullPrototype = Object.create(null) as Record<string, unknown>;
    nullPrototype.value = "x";
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    const rejected = [
      undefined,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      1n,
      Symbol("x"),
      () => undefined,
      new Date(),
      new Error("audit-secret-should-not-persist"),
      new Request("https://example.test"),
      new Response("audit-secret-should-not-persist"),
      new Headers({ authorization: "Bearer audit-token-should-not-persist" }),
      new Map(),
      new Set(),
      Buffer.from("audit-secret-should-not-persist"),
      new Uint8Array([1]),
      new CustomValue(),
      new (class extends Array {})(),
      nullPrototype,
      cyclic,
    ];

    for (const value of rejected) {
      expect(() => redactAuditJson(value)).toThrow(AuditEventError);
      try {
        redactAuditJson(value);
      } catch (error) {
        expect(error).toMatchObject({
          code: "VALIDATION",
          message: "Invalid audit event input",
        });
        expect(String(error)).not.toContain("audit-secret-should-not-persist");
      }
    }
  });

  it("preserves an own __proto__ JSON key without changing the output prototype", () => {
    const output = redactAuditJson(
      JSON.parse('{"__proto__":{"safe":"value"}}'),
    ) as Record<string, unknown>;

    expect(Object.getPrototypeOf(output)).toBe(Object.prototype);
    expect(output.__proto__).toEqual({ safe: "value" });
  });

  it("rejects accessors and inspection failures without invoking getters", () => {
    let getterCalled = false;
    const getterAccessor: Record<string, unknown> = {};
    Object.defineProperty(getterAccessor, "secret", {
      enumerable: true,
      get() {
        getterCalled = true;
        return "audit-secret-should-not-persist";
      },
    });
    const setterAccessor: Record<string, unknown> = {};
    Object.defineProperty(setterAccessor, "token", {
      enumerable: true,
      set() {
        getterCalled = true;
      },
    });
    const inspectionFailure = new Proxy(
      {},
      {
        ownKeys() {
          return ["secret"];
        },
        getOwnPropertyDescriptor() {
          throw new Error("audit-secret-should-not-persist");
        },
      },
    );

    for (const value of [getterAccessor, setterAccessor, inspectionFailure]) {
      expect(() => redactAuditJson(value)).toThrow(AuditEventError);
      try {
        redactAuditJson(value);
      } catch (error) {
        expect(String(error)).not.toContain("audit-secret-should-not-persist");
      }
    }
    expect(getterCalled).toBe(false);
  });
});
