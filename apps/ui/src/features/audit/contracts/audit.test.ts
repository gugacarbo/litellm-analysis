import { describe, expect, it } from "vitest";
import { auditEventIdInputSchema, auditListInputSchema } from "./audit";

describe("audit public contracts", () => {
  it("accepts only filters, cursor direction, page size and ID", () => {
    expect(
      auditListInputSchema.safeParse({
        action: "model.updated",
        pageSize: 50,
        actorType: "api_key",
        source: "proxy",
        requestId: "forged-request",
        actorRole: "viewer",
        session: "session-should-not-persist",
      }).success,
    ).toBe(false);
    expect(
      auditEventIdInputSchema.safeParse({
        id: "11111111-1111-4111-8111-111111111111",
        authorization: "Bearer audit-token-should-not-persist",
      }).success,
    ).toBe(false);
  });

  it("normalizes the default page size and requires a cursor direction pair", () => {
    expect(auditListInputSchema.parse({})).toEqual({ pageSize: 50 });
    expect(auditListInputSchema.safeParse({ cursor: "cursor" }).success).toBe(
      false,
    );
  });
});
