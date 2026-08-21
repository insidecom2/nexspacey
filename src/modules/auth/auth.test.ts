import { describe, expect, it } from "vitest";
import { hashPassword } from "@/modules/auth/auth.service";

describe("password hashing", () => {
  it("uses the versioned scrypt format", async () => {
    const hash = await hashPassword("correct horse battery staple");
    const [algorithm, salt, derivedKey] = hash.split(":");
    expect(algorithm).toBe("scrypt");
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(derivedKey).toMatch(/^[0-9a-f]{128}$/);
  });

  it("uses a fresh salt for each password hash", async () => {
    expect(await hashPassword("same password")).not.toBe(await hashPassword("same password"));
  });
});
