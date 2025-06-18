
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/AppContext';
import { Toaster } from '@/components/ui/toaster';
import Navigation from '@/components/Navigation';
import Dashboard from '@/pages/Dashboard';
import Teams from '@/pages/Teams';
import People from '@/pages/People';
import Projects from '@/pages/Projects';
import Epics from '@/pages/Epics';
import Skills from '@/pages/Skills';
import Financials from '@/pages/Financials';
import Planning from '@/pages/Planning';
import Allocations from '@/pages/Allocations';
import Tracking from '@/pages/Tracking';
import Milestones from '@/pages/Milestones';
import Canvas from '@/pages/Canvas';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/people" element={<People />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/epics" element={<Epics />} />
                <Route path="/skills" element={<Skills />} />
                <Route path="/financials" element={<Financials />} />
                <Route path="/planning" element={<Planning />} />
                <Route path="/allocations" element={<Allocations />} />
                <Route path="/tracking" element={<Tracking />} />
                <Route path="/milestones" element={<Milestones />} />
                <Route path="/canvas" element={<Canvas />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
          <Toaster />
        </Router>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
