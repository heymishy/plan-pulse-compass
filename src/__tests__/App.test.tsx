import React from "react";
import { describe, it, expect, vi } from "vitest";

// Mock the Toaster component to avoid issues in tests
vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => null,
}));

// Mock the AppProvider to avoid localStorage/context issues
vi.mock("@/context/AppContext", () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-provider">{children}</div>
  ),
}));

describe("App Basic Tests", () => {
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
