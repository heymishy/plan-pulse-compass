import { describe, it, expect } from "vitest";

describe("Setup Debug Test", () => {
  it("should import setup file without hanging", async () => {
    // Try to import the setup file
    const setupModule = await import("../test/setup.ts");
    expect(setupModule).toBeDefined();
  });

  it("should work with basic assertions", () => {
    expect(1 + 1).toBe(2);
  });
});
