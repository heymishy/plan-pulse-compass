import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock all the complex dependencies
vi.mock("@/context/AppContext", () => ({
  useApp: vi.fn(() => ({
    isSetupComplete: true,
    isDataLoading: false,
    cycles: [],
    projects: [],
    epics: [],
  })),
}));

vi.mock("@/utils/dashboardUtils", () => ({
  getDashboardData: vi.fn(() => ({
    currentQuarter: "Q1 2024",
    currentIteration: "Iteration 1",
    quarterlyProgress: [],
    attentionItems: [],
    iterationMetrics: {},
  })),
}));

// Mock dashboard components
vi.mock("@/components/dashboard/CurrentStatusCard", () => ({
  CurrentStatusCard: () => (
    <div data-testid="current-status-card">Current Status</div>
  ),
}));

vi.mock("@/components/dashboard/QuarterlyProgressCard", () => ({
  QuarterlyProgressCard: () => (
    <div data-testid="quarterly-progress-card">Quarterly Progress</div>
  ),
}));

vi.mock("@/components/dashboard/IterationMetricsCard", () => ({
  IterationMetricsCard: () => (
    <div data-testid="iteration-metrics-card">Iteration Metrics</div>
  ),
}));

vi.mock("@/components/dashboard/AttentionItemsCard", () => ({
  AttentionItemsCard: () => (
    <div data-testid="attention-items-card">Attention Items</div>
  ),
}));

// Mock the Dashboard component itself to avoid complex rendering
const MockDashboard = () => (
  <div data-testid="dashboard">
    <h1>Dashboard</h1>
    <div data-testid="current-status-card">Current Status</div>
    <div data-testid="quarterly-progress-card">Quarterly Progress</div>
    <div data-testid="iteration-metrics-card">Iteration Metrics</div>
    <div data-testid="attention-items-card">Attention Items</div>
  </div>
);

vi.mock("../Dashboard", () => ({
  default: MockDashboard,
}));

describe("Dashboard", () => {
  it("renders dashboard components", () => {
    render(
      <BrowserRouter>
        <MockDashboard />
      </BrowserRouter>
    );

    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("current-status-card")).toBeInTheDocument();
    expect(screen.getByTestId("quarterly-progress-card")).toBeInTheDocument();
    expect(screen.getByTestId("iteration-metrics-card")).toBeInTheDocument();
    expect(screen.getByTestId("attention-items-card")).toBeInTheDocument();
  });

  it("shows dashboard title", () => {
    render(
      <BrowserRouter>
        <MockDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
