import { describe, it, expect } from "vitest";

describe("Pure JavaScript Test", () => {
  it("should work with basic math", () => {
    expect(2 + 2).toBe(4);
  });

  it("should work with arrays", () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
  });

  it("should work with objects", () => {
    const obj = { name: "test" };
    expect(obj.name).toBe("test");
  });
});
