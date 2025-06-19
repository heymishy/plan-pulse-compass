
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import Dashboard from '@/pages/Dashboard';
import Teams from '@/pages/Teams';
import People from '@/pages/People';
import Projects from '@/pages/Projects';
import Epics from '@/pages/Epics';
import Planning from '@/pages/Planning';
import Allocations from '@/pages/Allocations';
import Tracking from '@/pages/Tracking';
import ScenarioAnalysis from '@/pages/ScenarioAnalysis';
import Reports from '@/pages/Reports';
import Financials from '@/pages/Financials';
import Skills from '@/pages/Skills';
import Canvas from '@/pages/Canvas';
import Settings from '@/pages/Settings';
import Setup from '@/pages/Setup';
import Milestones from '@/pages/Milestones';
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="flex min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="*" element={
              <>
                <Navigation />
                <div className="flex-1 overflow-auto">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/people" element={<People />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/epics" element={<Epics />} />
                    <Route path="/milestones" element={<Milestones />} />
                    <Route path="/planning" element={<Planning />} />
                    <Route path="/allocations" element={<Allocations />} />
                    <Route path="/tracking" element={<Tracking />} />
                    <Route path="/scenario-analysis" element={<ScenarioAnalysis />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/financials" element={<Financials />} />
                    <Route path="/skills" element={<Skills />} />
                    <Route path="/canvas" element={<Canvas />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </>
            } />
          </Routes>
        </div>
        <Toaster />
      </Router>
    </AppProvider>
  );
}

export default App;
