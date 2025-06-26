import { describe, it, expect } from "vitest";
import { getDashboardData } from "../dashboardUtils";
import type { Cycle } from "../../types";

describe("dashboardUtils", () => {
  describe("getDashboardData", () => {
    it("returns dashboard data structure when cycles array is empty", () => {
      const result = getDashboardData([], [], [], [], [], []);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty("currentQuarter");
      expect(result).toHaveProperty("currentIteration");
      expect(result).toHaveProperty("quarterlyProgress");
      expect(result).toHaveProperty("attentionItems");
      expect(result).toHaveProperty("iterationMetrics");
    });

    it("returns dashboard data structure when cycles array is undefined", () => {
      const result = getDashboardData(
        undefined as unknown as Cycle[],
        [],
        [],
        [],
        [],
        []
      );
      expect(result).not.toBeNull();
      expect(result).toHaveProperty("currentQuarter");
      expect(result).toHaveProperty("currentIteration");
      expect(result).toHaveProperty("quarterlyProgress");
      expect(result).toHaveProperty("attentionItems");
      expect(result).toHaveProperty("iterationMetrics");
    });

    it("returns dashboard data when cycles are provided", () => {
      const mockCycles: Cycle[] = [
        {
          id: "1",
          name: "Q1 2024",
          startDate: "2024-01-01",
          endDate: "2024-03-31",
          type: "quarterly",
          status: "active",
        },
      ];

      const result = getDashboardData(mockCycles, [], [], [], [], []);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty("currentQuarter");
      expect(result).toHaveProperty("currentIteration");
      expect(result).toHaveProperty("quarterlyProgress");
      expect(result).toHaveProperty("attentionItems");
      expect(result).toHaveProperty("iterationMetrics");
    });

    it("handles cycles that are not currently active", () => {
      const mockCycles: Cycle[] = [
        {
          id: "1",
          name: "Q1 2024",
          startDate: "2024-01-01",
          endDate: "2024-03-31",
          type: "quarterly",
          status: "active",
        },
        {
          id: "2",
          name: "Q2 2024",
          startDate: "2024-04-01",
          endDate: "2024-06-30",
          type: "quarterly",
          status: "active",
        },
      ];

      const result = getDashboardData(mockCycles, [], [], [], [], []);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("currentQuarter");
      expect(result).toHaveProperty("currentIteration");
    });

    it("handles empty allocations and projects", () => {
      const mockCycles: Cycle[] = [
        {
          id: "1",
          name: "Q1 2024",
          startDate: "2024-01-01",
          endDate: "2024-03-31",
          type: "quarterly",
          status: "active",
        },
      ];

      const result = getDashboardData(mockCycles, [], [], [], [], []);

      expect(result?.quarterlyProgress.epics).toEqual({
        completed: 0,
        total: 0,
        percentage: 0,
      });
      expect(result?.quarterlyProgress.milestones).toEqual({
        completed: 0,
        total: 0,
        percentage: 0,
      });
      expect(result?.attentionItems).toEqual({
        atRiskMilestones: 0,
        openRisks: 0,
      });
    });
  });
});
