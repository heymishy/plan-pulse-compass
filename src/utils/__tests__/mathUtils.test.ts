import { describe, it, expect } from "vitest";

// Simple utility functions for testing
export const add = (a: number, b: number): number => a + b;
export const subtract = (a: number, b: number): number => a - b;
export const multiply = (a: number, b: number): number => a * b;
export const divide = (a: number, b: number): number => {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
};

describe("Math Utils", () => {
  describe("add", () => {
    it("should add two positive numbers", () => {
      expect(add(2, 3)).toBe(5);
    });

    it("should add negative numbers", () => {
      expect(add(-1, -2)).toBe(-3);
    });

    it("should add zero", () => {
      expect(add(5, 0)).toBe(5);
    });
  });

  describe("subtract", () => {
    it("should subtract two numbers", () => {
      expect(subtract(5, 3)).toBe(2);
    });

    it("should handle negative results", () => {
      expect(subtract(2, 5)).toBe(-3);
    });
  });

  describe("multiply", () => {
    it("should multiply two numbers", () => {
      expect(multiply(4, 3)).toBe(12);
    });

    it("should handle zero", () => {
      expect(multiply(5, 0)).toBe(0);
    });
  });

  describe("divide", () => {
    it("should divide two numbers", () => {
      expect(divide(10, 2)).toBe(5);
    });

    it("should throw error on division by zero", () => {
      expect(() => divide(10, 0)).toThrow("Division by zero");
    });
  });
});
