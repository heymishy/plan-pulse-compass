
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navigation from './components/Navigation';
import Index from './pages/Index';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import People from './pages/People';
import Skills from './pages/Skills';
import Projects from './pages/Projects';
import Epics from './pages/Epics';
import Milestones from './pages/Milestones';
import Planning from './pages/Planning';
import AdvancedPlanning from './pages/AdvancedPlanning';
import Allocations from './pages/Allocations';
import Tracking from './pages/Tracking';
import Financials from './pages/Financials';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Canvas from './pages/Canvas';
import ScenarioAnalysis from './pages/ScenarioAnalysis';
import NotFound from './pages/NotFound';
import { Toaster } from '@/components/ui/toaster';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/people" element={<People />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/epics" element={<Epics />} />
              <Route path="/milestones" element={<Milestones />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/advanced-planning" element={<AdvancedPlanning />} />
              <Route path="/allocations" element={<Allocations />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/financials" element={<Financials />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/canvas" element={<Canvas />} />
              <Route path="/scenario-analysis" element={<ScenarioAnalysis />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
