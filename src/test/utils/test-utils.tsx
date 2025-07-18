import React, { ReactElement } from 'react';
import { render, RenderOptions, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, afterEach } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/context/ThemeContext';

// Mock the Toaster component to avoid issues in tests
vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => null,
}));

// Clean up after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});

// Lightweight wrapper without AppProvider for simple component tests
const LightweightProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SidebarProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Wrapper for components that need sidebar context (like Navigation component)
const SidebarProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SidebarProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Wrapper for components that already have a router (like App component)
const NoRouterProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
};

// Lightweight render for simple component tests (default)
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: LightweightProviders, ...options });

// Render for components that need sidebar context
const renderWithSidebar = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: SidebarProviders, ...options });

// Render for components that already have a router
const renderWithoutRouter = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: NoRouterProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export {
  customRender as render,
  renderWithSidebar,
  renderWithoutRouter,
  NoRouterProviders,
};

// Helper function to create mock data
export const createMockPerson = (overrides = {}) => ({
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  roleId: '1',
  teamId: '1',
  employmentType: 'permanent' as const,
  salary: 80000,
  startDate: '2023-01-01',
  ...overrides,
});

export const createMockTeam = (overrides = {}) => ({
  id: '1',
  name: 'Engineering Team',
  divisionId: '1',
  capacity: 100,
  productOwnerId: '1',
  ...overrides,
});

export const createMockProject = (overrides = {}) => ({
  id: '1',
  name: 'Project Alpha',
  description: 'A revolutionary new product',
  status: 'active' as const,
  priority: 100,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  ...overrides,
});

export const createMockEpic = (overrides = {}) => ({
  id: '1',
  projectId: '1',
  name: 'User Authentication',
  description: 'Implement secure user authentication',
  status: 'in-progress' as const,
  priority: 1,
  ...overrides,
});

// Helper functions for common test patterns
export const getByTextFirst = (screen: any, text: string | RegExp) => {
  const elements = screen.getAllByText(text);
  return elements[0];
};

export const getByRoleFirst = (screen: any, role: string, options?: any) => {
  const elements = screen.getAllByRole(role, options);
  return elements[0];
};

export const waitForTextToAppear = (
  screen: any,
  text: string | RegExp,
  timeout = 1000
) => {
  return screen.findByText(text, {}, { timeout });
};

export const getSelectByIndex = (screen: any, index: number) => {
  const comboboxes = screen.getAllByRole('combobox');
  return comboboxes[index];
};
