import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TeamProvider } from './context/TeamContext';
import { ProjectProvider } from './context/ProjectContext';
import { PlanningProvider } from './context/PlanningContext';
import { SettingsProvider } from './context/SettingsContext';
import { GoalProvider } from './context/GoalContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, ScenarioAwareAppProvider } from './context/AppContext';
import { SafeScenarioAwareAppProvider } from './context/SafeScenarioAwareAppProvider';
import { ScenarioProvider } from './context/ScenarioContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import { ScenarioBanner } from './components/scenarios/ScenarioBanner';
import { ScenarioSwitcher } from './components/scenarios/ScenarioSwitcher';
import { EnhancedNavigation } from './components/navigation/enhanced-navigation';
import { PageBreadcrumb } from './components/navigation/breadcrumb-system';
import { KeyboardShortcutsProvider } from './components/navigation/keyboard-shortcuts';
// Core pages (loaded immediately)
import Index from './pages/Index';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import People from './pages/People';
import NotFound from './pages/NotFound';

// Heavy pages (lazy loaded)
const Skills = lazy(() => import('./pages/Skills'));
const Projects = lazy(() => import('./pages/Projects'));
const Epics = lazy(() => import('./pages/Epics'));
const Milestones = lazy(() => import('./pages/Milestones'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Planning = lazy(() => import('./pages/Planning'));
const AdvancedPlanning = lazy(() => import('./pages/AdvancedPlanning'));
const JourneyPlanning = lazy(() => import('./pages/JourneyPlanning'));
const Allocations = lazy(() => import('./pages/Allocations'));
const Tracking = lazy(() => import('./pages/Tracking'));
const Financials = lazy(() => import('./pages/Financials'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Canvas = lazy(() => import('./pages/Canvas'));
const ScenarioAnalysis = lazy(() => import('./pages/ScenarioAnalysis'));
const OCRPage = lazy(() => import('./pages/OCRPage'));
const FYProjectPlanning = lazy(() => import('./pages/FYProjectPlanning'));
import { Toaster } from '@/components/ui/toaster';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <TeamProvider>
          <ProjectProvider>
            <PlanningProvider>
              <GoalProvider>
                <ScenarioProvider>
                  <SafeScenarioAwareAppProvider>
                    <Router>
                      <KeyboardShortcutsProvider>
                        <SidebarProvider defaultOpen={true}>
                          <div
                            data-testid="app-container"
                            className="flex h-screen w-screen bg-background overflow-hidden"
                          >
                            <Sidebar
                              side="left"
                              variant="sidebar"
                              collapsible="icon"
                              className="border-r"
                            >
                              <EnhancedNavigation />
                            </Sidebar>
                            <SidebarInset className="flex-1 w-full h-full overflow-hidden">
                              <div className="flex flex-col h-full w-full overflow-hidden">
                                <ScenarioBanner />
                                <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                                  <div className="flex flex-col space-y-3">
                                    <div className="flex items-center justify-between min-w-0">
                                      <div className="flex items-center space-x-4 min-w-0">
                                        <h1 className="text-lg font-semibold truncate">
                                          Plan Pulse Compass
                                        </h1>
                                      </div>
                                      <div className="flex-shrink-0">
                                        <ScenarioSwitcher />
                                      </div>
                                    </div>
                                    <PageBreadcrumb
                                      showDescription={false}
                                      maxItems={5}
                                    />
                                  </div>
                                </div>
                                <main
                                  data-testid="app-loaded"
                                  className="flex-1 w-full max-w-none overflow-auto"
                                >
                                  <Suspense
                                    fallback={
                                      <div className="flex items-center justify-center h-64">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        <span className="ml-2 text-gray-600">
                                          Loading...
                                        </span>
                                      </div>
                                    }
                                  >
                                    <Routes>
                                      <Route path="/" element={<Index />} />
                                      <Route
                                        path="/setup"
                                        element={<Setup />}
                                      />
                                      <Route
                                        path="/dashboard"
                                        element={<Dashboard />}
                                      />
                                      <Route
                                        path="/teams"
                                        element={<Teams />}
                                      />
                                      <Route
                                        path="/people"
                                        element={<People />}
                                      />
                                      <Route
                                        path="/skills"
                                        element={<Skills />}
                                      />
                                      <Route
                                        path="/projects"
                                        element={<Projects />}
                                      />
                                      <Route
                                        path="/epics"
                                        element={<Epics />}
                                      />
                                      <Route
                                        path="/milestones"
                                        element={<Milestones />}
                                      />
                                      <Route
                                        path="/calendar"
                                        element={<Calendar />}
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
                                        path="/fy-planning"
                                        element={<FYProjectPlanning />}
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
                                      <Route
                                        path="/reports"
                                        element={<Reports />}
                                      />
                                      <Route
                                        path="/settings"
                                        element={<Settings />}
                                      />
                                      <Route
                                        path="/canvas"
                                        element={<Canvas />}
                                      />
                                      <Route
                                        path="/scenario-analysis"
                                        element={<ScenarioAnalysis />}
                                      />
                                      <Route
                                        path="/ocr"
                                        element={<OCRPage />}
                                      />
                                      <Route path="*" element={<NotFound />} />
                                    </Routes>
                                  </Suspense>
                                </main>
                                <Footer />
                              </div>
                            </SidebarInset>
                          </div>
                          <Toaster />
                        </SidebarProvider>
                      </KeyboardShortcutsProvider>
                    </Router>
                  </SafeScenarioAwareAppProvider>
                </ScenarioProvider>
              </GoalProvider>
            </PlanningProvider>
          </ProjectProvider>
        </TeamProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
