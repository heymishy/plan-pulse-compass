import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { vi } from "vitest";

// Mock the Toaster component to avoid issues in tests
vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => null,
}));

// Full wrapper with AppProvider for integration tests
const IntegrationProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </AppProvider>
  );
};

// Full render with AppProvider for integration tests
const integrationRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: IntegrationProviders, ...options });

// Re-export everything
export * from "@testing-library/react";

// Export integration render
export { integrationRender as render };
