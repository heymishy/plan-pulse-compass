import { describe, it, expect } from "vitest";

describe("Basic Test Setup", () => {
  it("should work with basic assertions", () => {
    expect(1 + 1).toBe(2);
    expect("hello").toBe("hello");
    expect(true).toBe(true);
  });

  it("should work with arrays", () => {
    const array = [1, 2, 3];
    expect(array).toHaveLength(3);
    expect(array).toContain(2);
  });

  it("should work with objects", () => {
    const obj = { name: "test", value: 42 };
    expect(obj).toHaveProperty("name");
    expect(obj.name).toBe("test");
  });
});
