import { describe, expect, it } from "vitest";
import {
  decryptProviderSecretForUpstream,
  encryptProviderSecret,
} from "./provider-secrets.js";

describe("provider credential envelope", () => {
  const key = Buffer.from("a".repeat(32));

  it("round-trips only a valid encrypted envelope", () => {
    const envelope = encryptProviderSecret("test-secret-value", key);
    expect(envelope).not.toContain("test-secret-value");
    expect(decryptProviderSecretForUpstream(envelope, key)).toBe(
      "test-secret-value",
    );
  });

  it("fails closed for plaintext and malformed envelopes", () => {
    expect(() =>
      decryptProviderSecretForUpstream("test-secret-value", key),
    ).toThrow("Stored provider credential cannot be decrypted");
    expect(() =>
      decryptProviderSecretForUpstream("enc:v1:not-json", key),
    ).toThrow("Stored provider credential cannot be decrypted");
  });
});
