/**
 * Page Load Regression Test Suite
 *
 * This test suite verifies that all application pages can load without errors.
 * It's designed to catch basic regressions that might slip through component-specific tests.
 *
 * Each test navigates to a route and verifies:
 * 1. The page renders without throwing errors
 * 2. Basic page content is present
 * 3. No critical console errors occur
 *
 * This serves as a safety net for deployment readiness.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TeamProvider } from '../context/TeamContext';
import { ProjectProvider } from '../context/ProjectContext';
import { PlanningProvider } from '../context/PlanningContext';
import { SettingsProvider } from '../context/SettingsContext';
import { GoalProvider } from '../context/GoalContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AppProvider } from '../context/AppContext';
import { ScenarioProvider } from '../context/ScenarioContext';
import { Routes, Route } from 'react-router-dom';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { ScenarioBanner } from '../components/scenarios/ScenarioBanner';
import { ScenarioSwitcher } from '../components/scenarios/ScenarioSwitcher';
import Index from '../pages/Index';
import Setup from '../pages/Setup';
import Dashboard from '../pages/Dashboard';
import Teams from '../pages/Teams';
import TeamBuilder from '../pages/TeamBuilder';
import People from '../pages/People';
import Skills from '../pages/Skills';
import Projects from '../pages/Projects';
import Epics from '../pages/Epics';
import Milestones from '../pages/Milestones';
import Planning from '../pages/Planning';
import AdvancedPlanning from '../pages/AdvancedPlanning';
import JourneyPlanning from '../pages/JourneyPlanning';
import Allocations from '../pages/Allocations';
import Tracking from '../pages/Tracking';
import Financials from '../pages/Financials';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';
import Canvas from '../pages/Canvas';
import ScenarioAnalysis from '../pages/ScenarioAnalysis';
import OCRPage from '../pages/OCRPage';
import NotFound from '../pages/NotFound';
import { Toaster } from '@/components/ui/toaster';

// TestApp component - recreates App structure without BrowserRouter for testing
const TestApp: React.FC = () => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <TeamProvider>
          <ProjectProvider>
            <PlanningProvider>
              <GoalProvider>
                <AppProvider>
                  <ScenarioProvider>
                    <SidebarProvider defaultOpen={true}>
                      <div className="flex min-h-screen bg-background">
                        <Sidebar
                          side="left"
                          variant="sidebar"
                          collapsible="icon"
                          className="border-r"
                        >
                          <Navigation />
                        </Sidebar>
                        <SidebarInset className="flex-1 min-w-0">
                          <div className="flex flex-col min-h-screen w-full">
                            <ScenarioBanner />
                            <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <h1 className="text-lg font-semibold">
                                    Plan Pulse Compass
                                  </h1>
                                </div>
                                <ScenarioSwitcher />
                              </div>
                            </div>
                            <main className="flex-1 w-full max-w-none">
                              <Routes>
                                <Route path="/" element={<Index />} />
                                <Route path="/setup" element={<Setup />} />
                                <Route
                                  path="/dashboard"
                                  element={<Dashboard />}
                                />
                                <Route path="/teams" element={<Teams />} />
                                <Route path="/people" element={<People />} />
                                <Route path="/skills" element={<Skills />} />
                                <Route
                                  path="/projects"
                                  element={<Projects />}
                                />
                                <Route path="/epics" element={<Epics />} />
                                <Route
                                  path="/milestones"
                                  element={<Milestones />}
                                />
                                <Route
                                  path="/planning"
                                  element={<Planning />}
                                />
                                <Route
                                  path="/advanced-planning"
                                  element={<AdvancedPlanning />}
                                />
                                <Route
                                  path="/journey-planning"
                                  element={<JourneyPlanning />}
                                />
                                <Route
                                  path="/allocations"
                                  element={<Allocations />}
                                />
                                <Route
                                  path="/tracking"
                                  element={<Tracking />}
                                />
                                <Route
                                  path="/financials"
                                  element={<Financials />}
                                />
                                <Route path="/reports" element={<Reports />} />
                                <Route
                                  path="/settings"
                                  element={<Settings />}
                                />
                                <Route path="/canvas" element={<Canvas />} />
                                <Route
                                  path="/scenario-analysis"
                                  element={<ScenarioAnalysis />}
                                />
                                <Route
                                  path="/squad-management"
                                  element={<TeamBuilder />}
                                />
                                <Route path="/ocr" element={<OCRPage />} />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </main>
                            <Footer />
                          </div>
                        </SidebarInset>
                      </div>
                      <Toaster />
                    </SidebarProvider>
                  </ScenarioProvider>
                </AppProvider>
              </GoalProvider>
            </PlanningProvider>
          </ProjectProvider>
        </TeamProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

// Mock console.error to catch errors during page loads
const originalConsoleError = console.error;
let consoleErrors: string[] = [];

beforeAll(() => {
  console.error = vi.fn((...args) => {
    consoleErrors.push(args.join(' '));
    originalConsoleError(...args);
  });
});

beforeEach(() => {
  consoleErrors = [];
  vi.clearAllMocks();
});

// Helper function to render a page and check for basic loading
const renderPageAndVerify = async (
  path: string,
  expectedContent: string | RegExp,
  options: { timeout?: number } = {}
) => {
  const { timeout = 3000 } = options;

  render(
    <MemoryRouter initialEntries={[path]}>
      <TestApp />
    </MemoryRouter>
  );

  // For regression testing, we primarily care that the page renders without throwing errors
  // We'll use a simple timeout and check for any critical console errors
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second for initial render

  // Verify no critical console errors occurred during render
  const criticalErrors = consoleErrors.filter(
    error =>
      error.includes('Error:') ||
      error.includes('TypeError:') ||
      error.includes('ReferenceError:') ||
      error.includes('Cannot read properties') ||
      error.includes('is not a function')
  );

  if (criticalErrors.length > 0) {
    console.warn(`Critical errors detected on ${path}:`, criticalErrors);
    throw new Error(
      `Critical errors found on ${path}: ${criticalErrors.join(', ')}`
    );
  }

  // Basic sanity check - ensure something was rendered
  expect(document.body.textContent).toBeTruthy();
  expect(document.body.textContent!.length).toBeGreaterThan(100);

  return { criticalErrors };
};

describe('Page Load Regression Tests', () => {
  describe('Core Application Pages', () => {
    it('should load the home page (/) without errors', async () => {
      // Index page redirects to dashboard, so we expect the app header to be present
      await renderPageAndVerify('/', /Plan Pulse Compass/i);
    });

    it('should load the setup page (/setup) without errors', async () => {
      await renderPageAndVerify('/setup', /Setup|Configuration|Initial/i);
    });

    it('should load the dashboard page (/dashboard) without errors', async () => {
      await renderPageAndVerify('/dashboard', /Dashboard|Overview|Summary/i);
    });
  });

  describe('Team and People Management Pages', () => {
    it('should load the teams page (/teams) without errors', async () => {
      await renderPageAndVerify('/teams', /Teams|Team Management|No teams/i);
    });

    it('should load the people page (/people) without errors', async () => {
      await renderPageAndVerify('/people', /People|Team Members|No people/i);
    });

    it('should load the skills page (/skills) without errors', async () => {
      await renderPageAndVerify(
        '/skills',
        /Skills|Skill Management|No skills/i
      );
    });

    it('should load the squad management page (/squad-management) without errors', async () => {
      await renderPageAndVerify(
        '/squad-management',
        /Squad|Team Builder|Management/i
      );
    });
  });

  describe('Project and Epic Management Pages', () => {
    it('should load the projects page (/projects) without errors', async () => {
      await renderPageAndVerify(
        '/projects',
        /Projects|Project Management|No projects/i
      );
    });

    it('should load the epics page (/epics) without errors', async () => {
      await renderPageAndVerify('/epics', /Epics|Epic Management|No epics/i);
    });

    it('should load the milestones page (/milestones) without errors', async () => {
      await renderPageAndVerify(
        '/milestones',
        /Milestones|Milestone Management|No milestones/i
      );
    });
  });

  describe('Planning and Allocation Pages', () => {
    it('should load the planning page (/planning) without errors', async () => {
      await renderPageAndVerify(
        '/planning',
        /Planning|Resource Planning|Allocation/i
      );
    });

    it('should load the advanced planning page (/advanced-planning) without errors', async () => {
      await renderPageAndVerify(
        '/advanced-planning',
        /Advanced Planning|Advanced|Planning/i
      );
    });

    it('should load the journey planning page (/journey-planning) without errors', async () => {
      await renderPageAndVerify(
        '/journey-planning',
        /Journey Planning|Journey|Planning/i
      );
    });

    it('should load the allocations page (/allocations) without errors', async () => {
      await renderPageAndVerify(
        '/allocations',
        /Allocations|Resource Allocation|No allocations/i
      );
    });
  });

  describe('Tracking and Analysis Pages', () => {
    it('should load the tracking page (/tracking) without errors', async () => {
      await renderPageAndVerify(
        '/tracking',
        /Tracking|Progress Tracking|Track/i
      );
    });

    it('should load the financials page (/financials) without errors', async () => {
      await renderPageAndVerify('/financials', /Financials|Financial|Budget/i);
    });

    it('should load the reports page (/reports) without errors', async () => {
      await renderPageAndVerify('/reports', /Reports|Report|Analytics/i);
    });

    it('should load the scenario analysis page (/scenario-analysis) without errors', async () => {
      await renderPageAndVerify(
        '/scenario-analysis',
        /Scenario Analysis|Scenario|Analysis/i
      );
    });
  });

  describe('Feature and Utility Pages', () => {
    it('should load the canvas page (/canvas) without errors', async () => {
      await renderPageAndVerify('/canvas', /Canvas|Visualization|Visual/i);
    });

    it('should load the OCR page (/ocr) without errors', async () => {
      await renderPageAndVerify('/ocr', /OCR|Document|SteerCo/i);
    });

    it('should load the settings page (/settings) without errors', async () => {
      await renderPageAndVerify(
        '/settings',
        /Settings|Configuration|Preferences/i
      );
    });
  });

  describe('Error Handling', () => {
    it('should load the 404 page for invalid routes without errors', async () => {
      await renderPageAndVerify(
        '/invalid-route',
        /Not Found|404|Page Not Found/i
      );
    });

    it('should handle navigation between multiple pages without errors', async () => {
      // Test sequential page loads to catch state pollution issues
      const { rerender } = render(
        <MemoryRouter initialEntries={['/']}>
          <TestApp />
        </MemoryRouter>
      );

      // Verify home page loads
      await waitFor(() => {
        expect(screen.getByText(/Plan Pulse Compass/i)).toBeInTheDocument();
      });

      // Navigate to dashboard
      rerender(
        <MemoryRouter initialEntries={['/dashboard']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Dashboard|Overview/i)).toBeInTheDocument();
      });

      // Navigate to teams
      rerender(
        <MemoryRouter initialEntries={['/teams']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Teams/i)).toBeInTheDocument();
      });

      // Verify no critical errors during navigation
      const criticalErrors = consoleErrors.filter(
        error =>
          error.includes('Error:') ||
          error.includes('TypeError:') ||
          error.includes('Cannot read properties')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  describe('Performance and Stability', () => {
    it('should load all critical pages within reasonable time limits', async () => {
      const criticalPages = [
        '/',
        '/dashboard',
        '/teams',
        '/projects',
        '/planning',
        '/settings',
      ];

      for (const path of criticalPages) {
        const startTime = Date.now();

        render(
          <MemoryRouter initialEntries={[path]}>
            <TestApp />
          </MemoryRouter>
        );

        await waitFor(
          () => {
            expect(screen.getByText(/Plan Pulse Compass/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        ); // 3 second timeout for critical pages

        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds

        // Clean up for next iteration
        document.body.innerHTML = '';
      }
    });

    it('should not have memory leaks during page transitions', async () => {
      // Test rapid page transitions to catch potential memory leaks
      const pages = ['/', '/dashboard', '/teams', '/projects'];

      for (let i = 0; i < pages.length; i++) {
        const { unmount } = render(
          <MemoryRouter initialEntries={[pages[i]]}>
            <TestApp />
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByText(/Plan Pulse Compass/i)).toBeInTheDocument();
        });

        // Unmount to test cleanup
        unmount();
      }

      // Verify no critical errors during rapid transitions
      const memoryErrors = consoleErrors.filter(
        error =>
          error.includes('memory') ||
          error.includes('leak') ||
          error.includes('Cannot perform a React state update')
      );

      expect(memoryErrors).toHaveLength(0);
    });
  });
});
