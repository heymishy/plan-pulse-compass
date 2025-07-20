import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TeamProvider } from './context/TeamContext';
import { ProjectProvider } from './context/ProjectContext';
import { PlanningProvider } from './context/PlanningContext';
import { SettingsProvider } from './context/SettingsContext';
import { GoalProvider } from './context/GoalContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { ScenarioProvider } from './context/ScenarioContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import { ScenarioBanner } from './components/scenarios/ScenarioBanner';
import { ScenarioSwitcher } from './components/scenarios/ScenarioSwitcher';
import Index from './pages/Index';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import TeamBuilder from './pages/TeamBuilder';
import People from './pages/People';
import Skills from './pages/Skills';
import Projects from './pages/Projects';
import Epics from './pages/Epics';
import Milestones from './pages/Milestones';
import Planning from './pages/Planning';
import AdvancedPlanning from './pages/AdvancedPlanning';
import JourneyPlanning from './pages/JourneyPlanning';
import Allocations from './pages/Allocations';
import Tracking from './pages/Tracking';
import Financials from './pages/Financials';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Canvas from './pages/Canvas';
import ScenarioAnalysis from './pages/ScenarioAnalysis';
import NotFound from './pages/NotFound';
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
                <AppProvider>
                  <ScenarioProvider>
                    <Router>
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
                                  <Route
                                    path="/reports"
                                    element={<Reports />}
                                  />
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
                    </Router>
                  </ScenarioProvider>
                </AppProvider>
              </GoalProvider>
            </PlanningProvider>
          </ProjectProvider>
        </TeamProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
